import _ from 'lodash';
import { batch } from 'react-redux';

import { MediaEnums } from '../enums';
import store from '../store';
import { ArrayUtils, StringUtils } from '../utils';
import MediaProviderService from './media-provider.service';
import { MediaTrackDatastore } from '../datastores';

import {
  IMediaPlayback,
  IMediaQueueTrack,
  IMediaTrack,
  IMediaTrackList,
} from '../interfaces';

const debug = require('debug')('app:service:media_player_service');

class MediaPlayerService {
  private mediaProgressReportRetryCount = 15;
  private mediaProgressReportRetryDelayMS = 150;
  private mediaProgressReportCurrentRetryCount = 0;

  // media queue control API

  playMediaTrack(mediaTrack: IMediaTrack): void {
    const {
      mediaPlayer,
    } = store.getState();

    const {
      mediaPlaybackCurrentMediaTrack,
      mediaPlaybackCurrentPlayingInstance,
    } = mediaPlayer;

    if (mediaPlaybackCurrentMediaTrack && mediaPlaybackCurrentPlayingInstance) {
      // resume media playback if we are playing same track
      if (mediaPlaybackCurrentMediaTrack.id === mediaTrack.id) {
        debug('playMediaTrack - resuming - media track id - %s', mediaPlaybackCurrentMediaTrack.id);
        this.resumeMediaPlayer();
        return;
      }

      // pause media player
      debug('playMediaTrack - pausing - media track id - %s', mediaPlaybackCurrentMediaTrack.id);
      this.pauseMediaPlayer();
    }

    // add track to the queue
    // important - setting track will remove all existing ones
    this.loadMediaTrackToQueue(mediaTrack);

    // request media provider to load and play the track
    this.loadAndPlayMediaTrack();
  }

  playMediaTracks(mediaTracks: IMediaTrack[], mediaTrackList?: IMediaTrackList): void {
    if (_.isEmpty(mediaTracks)) {
      throw new Error('MediaPlayerService encountered error at playMediaTracks - Empty track list was provided');
    }

    const {
      mediaPlayer,
    } = store.getState();

    const {
      mediaPlaybackCurrentMediaTrack,
      mediaPlaybackCurrentTrackList,
      mediaPlaybackCurrentPlayingInstance,
    } = mediaPlayer;

    if (mediaPlaybackCurrentMediaTrack && mediaPlaybackCurrentPlayingInstance) {
      // resume media playback if we are playing same tracklist
      if (mediaPlaybackCurrentTrackList?.id === mediaTrackList?.id) {
        debug('playMediaTrack - resuming - media track id - %s', mediaPlaybackCurrentMediaTrack.id);
        this.resumeMediaPlayer();
        return;
      }

      // pause media player
      debug('playMediaTrack - pausing - media track id - %s', mediaPlaybackCurrentMediaTrack.id);
      this.pauseMediaPlayer();
    }

    // add tracks to the queue
    // important - setting tracks will remove all existing ones
    this.loadMediaTracksToQueue(mediaTracks, mediaTrackList);

    // request media provider to load and play the track
    this.loadAndPlayMediaTrack();
  }

  playMediaTrackFromList(mediaTracks: IMediaTrack[], mediaTrackPointer: number, mediaTrackList?: IMediaTrackList): void {
    if (_.isEmpty(mediaTracks)) {
      throw new Error('MediaPlayerService encountered error at playMediaTracks - Empty track list was provided');
    }

    const mediaTrack = mediaTracks[mediaTrackPointer];
    if (!mediaTrack) {
      throw new Error('MediaPlayerService encountered error at playMediaTracks - Provided media track does not exists in the list');
    }

    const {
      mediaPlayer,
    } = store.getState();

    const {
      mediaPlaybackCurrentMediaTrack,
      mediaPlaybackCurrentTrackList,
      mediaPlaybackCurrentPlayingInstance,
      mediaPlaybackQueueOnShuffle,
    } = mediaPlayer;

    if (mediaPlaybackCurrentMediaTrack && mediaPlaybackCurrentPlayingInstance) {
      // resume media playback if we are playing same tracklist
      if (mediaPlaybackCurrentTrackList?.id === mediaTrackList?.id && mediaPlaybackCurrentMediaTrack.id === mediaTrack.id) {
        debug('playMediaTrack - resuming - media track id - %s', mediaPlaybackCurrentMediaTrack.id);
        this.resumeMediaPlayer();
        return;
      }

      // pause media player
      debug('playMediaTrack - pausing - media track id - %s', mediaPlaybackCurrentMediaTrack.id);
      this.pauseMediaPlayer();
    }

    // add tracks to the queue
    // important - setting tracks will remove all existing ones
    // important - pass the pointer for the track whose position will be preserved in case shuffling is enabled
    // in case shuffling is enabled, track to load will be on top of the list
    const mediaQueueTracks = this.loadMediaTracksToQueue(mediaTracks, mediaTrackList, mediaTrackPointer);

    // request media provider to load and play the track
    const mediaQueueTrackToPlay = mediaPlaybackQueueOnShuffle ? mediaQueueTracks[0] : mediaQueueTracks[mediaTrackPointer];
    this.loadAndPlayMediaTrack(mediaQueueTrackToPlay);
  }

  playMediaTrackFromQueue(mediaQueueTrack: IMediaQueueTrack) {
    const {
      mediaPlayer,
    } = store.getState();

    const {
      mediaPlaybackCurrentMediaTrack,
    } = mediaPlayer;

    // if the current media track is same as provided one, simply resume and conclude
    if (mediaPlaybackCurrentMediaTrack && mediaPlaybackCurrentMediaTrack.queue_entry_id === mediaQueueTrack.queue_entry_id) {
      this.resumeMediaPlayer();
      return;
    }

    // pause current playing instance
    this.pauseMediaPlayer();

    // load up and play found track from queue
    this.loadAndPlayMediaTrack(mediaQueueTrack);
  }

  addMediaTrackToQueue(mediaTrack: IMediaTrack, mediaTrackAddToQueueOptions?: {
    skipUserNotification?: boolean
  }): void {
    const {
      mediaPlayer,
    } = store.getState();

    const {
      mediaTracks,
      mediaPlaybackCurrentTrackList,
      mediaPlaybackCurrentMediaTrack,
      mediaTrackLastInsertedQueueId,
    } = mediaPlayer;

    const mediaQueueTrack = this.getMediaQueueTrack(mediaTrack);

    // #1 - determine the track after which the new track will be inserted
    // by default, it will get inserted at start of the list
    // if mediaTrackLastInsertedQueueId is present, track will be inserted after that track
    // otherwise, if mediaPlaybackCurrentMediaTrack is present, track will be inserted after that track
    let mediaTrackExistingPointer;
    if (mediaTrackLastInsertedQueueId) {
      mediaTrackExistingPointer = _.findIndex(mediaTracks, track => track.queue_entry_id === mediaTrackLastInsertedQueueId);
    } else if (mediaPlaybackCurrentMediaTrack) {
      mediaTrackExistingPointer = _.findIndex(mediaTracks, track => track.queue_entry_id === mediaPlaybackCurrentMediaTrack.queue_entry_id);
    }

    // #2 - update the queue_insertion_index for the new track with that of obtained track
    // this will be a simple increment as we are inserting it after the obtained track
    let mediaTrackInsertPointer = 0;
    if (!_.isNil(mediaTrackExistingPointer)) {
      mediaTrackInsertPointer = mediaTrackExistingPointer + 1;

      const mediaTrackExisting = mediaTracks[mediaTrackExistingPointer];
      mediaQueueTrack.queue_insertion_index = mediaTrackExisting.queue_insertion_index + 1;
    }

    // #3 - insert the new track from the obtained pointer
    mediaTracks.splice(mediaTrackInsertPointer, 0, mediaQueueTrack);

    // #4 - update the queue_insertion_index for all the subsequent tracks in queue
    // this is as well is going to be a simple increment over the previous value as have inserted only one track
    for (let mediaTrackPointer = mediaTrackInsertPointer + 1; mediaTrackPointer < mediaTracks.length; mediaTrackPointer += 1) {
      const mediaTrackFromQueue = mediaTracks[mediaTrackPointer];
      if (mediaTrackFromQueue.queue_insertion_index >= mediaQueueTrack.queue_insertion_index) {
        mediaTrackFromQueue.queue_insertion_index += 1;
      }
    }

    // #5 - update state
    store.dispatch({
      type: MediaEnums.MediaPlayerActions.SetTracks,
      data: {
        mediaTracks,
        // important - adding a track outside current tracklist will reset it
        mediaTrackList: mediaPlaybackCurrentTrackList && mediaPlaybackCurrentTrackList.id === mediaQueueTrack.tracklist_id
          ? mediaPlaybackCurrentTrackList
          : undefined,
        // important to send the mediaTrackLastInsertedQueueId with that of track we inserted
        // this is to keep track of the inserted track when we are inserting a new one in the list
        mediaTrackLastInsertedQueueId: mediaQueueTrack.queue_entry_id,
      },
    });

    // #6 - if there's no loaded track currently, load the added track
    if (!mediaPlaybackCurrentMediaTrack) {
      this.loadMediaTrack(mediaQueueTrack);
    }

    // #7 - notify user
    if (!mediaTrackAddToQueueOptions?.skipUserNotification) {
      // TODO: Add support for sending notification
      //  "Track was added to the queue"
    }
  }

  addMediaTracksToQueue(mediaTracksToAdd: IMediaTrack[]): void {
    mediaTracksToAdd.forEach((mediaTrackToAdd) => {
      this.addMediaTrackToQueue(mediaTrackToAdd, {
        skipUserNotification: true,
      });
    });
  }

  removeMediaTrackFromQueue(mediaQueueTrack: IMediaQueueTrack): void {
    const {
      mediaPlayer,
    } = store.getState();

    const {
      mediaTracks,
      mediaPlaybackCurrentTrackList,
    } = mediaPlayer;

    // #1 - determine the position from where the track needs to be removed
    const mediaQueueTrackPointer = _.findIndex(mediaTracks, mediaTrack => mediaTrack.queue_entry_id === mediaQueueTrack.queue_entry_id);
    if (_.isNil(mediaQueueTrackPointer)) {
      throw new Error('MediaPlayerService encountered error at removeMediaTrackFromQueue - Provided media track was not found in the list');
    }

    // #2 - remove track from the list using the obtained position
    _.pullAt(mediaTracks, mediaQueueTrackPointer);

    // #3 - update the queue_insertion_index for all the subsequent tracks in queue
    // this is as well is going to be a simple decrement over the previous value as have removed only one track
    for (let mediaTrackPointer = 0; mediaTrackPointer < mediaTracks.length; mediaTrackPointer += 1) {
      const mediaTrackFromQueue = mediaTracks[mediaTrackPointer];
      if (mediaTrackFromQueue.queue_insertion_index >= mediaQueueTrack.queue_insertion_index) {
        mediaTrackFromQueue.queue_insertion_index -= 1;
      }
    }

    // #4 - update state
    store.dispatch({
      type: MediaEnums.MediaPlayerActions.SetTracks,
      data: {
        mediaTracks,
        // important - retain existing tracklist when removing tracks
        mediaTrackList: mediaPlaybackCurrentTrackList,
      },
    });
  }

  loadMediaTrack(mediaQueueTrack: IMediaQueueTrack): IMediaPlayback {
    const {
      mediaPlayer,
    } = store.getState();

    const {
      mediaPlaybackVolumeCurrent,
      mediaPlaybackVolumeMaxLimit,
      mediaPlaybackVolumeMuted,
    } = mediaPlayer;

    // loading a media track will always remove the track repeat
    this.removeTrackRepeat();

    // request media playback instance for the provided track from the media provider
    const { mediaPlaybackService } = MediaProviderService.getMediaProvider(mediaQueueTrack.provider);
    const mediaPlayback = mediaPlaybackService.playMediaTrack(mediaQueueTrack, {
      mediaPlaybackVolume: mediaPlaybackVolumeCurrent,
      mediaPlaybackMaxVolume: mediaPlaybackVolumeMaxLimit,
      mediaPlaybackVolumeMuted,
    });

    // load the track
    store.dispatch({
      type: MediaEnums.MediaPlayerActions.LoadTrack,
      data: {
        mediaQueueTrackEntryId: mediaQueueTrack.queue_entry_id,
        mediaPlayingInstance: mediaPlayback,
        // important - in order to prevent adding tracks to queue before the current playing track
        // loading a track would always reset the last inserted track pointer
        mediaTrackLastInsertedQueueId: undefined,
      },
    });

    return mediaPlayback;
  }

  loadMediaQueueTracks(mediaQueueTracks: IMediaQueueTrack[], mediaTrackList?: IMediaTrackList) {
    store.dispatch({
      type: MediaEnums.MediaPlayerActions.SetTracks,
      data: {
        mediaTracks: mediaQueueTracks,
        mediaTrackList,
      },
    });
  }

  async revalidatePlayer(): Promise<void> {
    // this run revalidation on the current queued tracks
    // this removes / unloads track(s) which are not found in the datastore
    // important - this does not update any track in place

    const { mediaPlayer } = store.getState();
    const {
      mediaTracks,
      mediaPlaybackCurrentTrackList,
      mediaTrackLastInsertedQueueId,
      mediaPlaybackCurrentMediaTrack,
    } = mediaPlayer;

    // revalidate queue
    const mediaTrackIds = mediaTracks.map(mediaTrack => mediaTrack.id);
    const mediaTracksUpdated = await MediaTrackDatastore.findMediaTracks({
      id: {
        $in: mediaTrackIds,
      },
    });
    const mediaTracksUpdatedIds = mediaTracksUpdated.map(mediaTrack => mediaTrack.id);
    const mediaQueueTracksUpdated = mediaTracks.filter(mediaTrack => mediaTracksUpdatedIds.includes(mediaTrack.id));

    store.dispatch({
      type: MediaEnums.MediaPlayerActions.SetTracks,
      data: {
        mediaTracks: mediaQueueTracksUpdated,
        mediaTrackList: mediaPlaybackCurrentTrackList,
        mediaTrackLastInsertedQueueId,
      },
    });

    // revalidate current playing track
    // if the current track was not found in the updated list, pause and load next on player
    // if no tracks are in queue, stop the player
    if (mediaPlaybackCurrentMediaTrack && !mediaTracksUpdatedIds.includes(mediaPlaybackCurrentMediaTrack.id)) {
      const nextMediaTrack = this.getNextFromList();
      if (nextMediaTrack) {
        this.pauseMediaPlayer();
        this.loadMediaTrack(nextMediaTrack);
      } else {
        this.stopMediaPlayer();
      }
    }
  }

  // media playback control API

  pauseMediaPlayer(): void {
    const {
      mediaPlayer,
    } = store.getState();
    const {
      mediaPlaybackCurrentMediaTrack,
      mediaPlaybackCurrentPlayingInstance,
    } = mediaPlayer;

    if (!mediaPlaybackCurrentMediaTrack || !mediaPlaybackCurrentPlayingInstance) {
      return;
    }

    mediaPlaybackCurrentPlayingInstance
      .pausePlayback()
      .then((mediaPlaybackPaused) => {
        if (!mediaPlaybackPaused) {
          // TODO: Handle cases where media playback could not be paused
          return;
        }

        store.dispatch({
          type: MediaEnums.MediaPlayerActions.PausePlayer,
        });
      });
  }

  resumeMediaPlayer(): void {
    const {
      mediaPlayer,
    } = store.getState();

    const {
      mediaPlaybackCurrentMediaTrack,
      mediaPlaybackCurrentPlayingInstance,
    } = mediaPlayer;

    if (!mediaPlaybackCurrentMediaTrack || !mediaPlaybackCurrentPlayingInstance) {
      return;
    }

    store.dispatch({
      type: MediaEnums.MediaPlayerActions.LoadingTrack,
    });

    mediaPlaybackCurrentPlayingInstance
      .resumePlayback()
      .then((mediaPlaybackResumed) => {
        if (!mediaPlaybackResumed) {
          // TODO: Handle cases where playback could not be resumed
          return;
        }

        store.dispatch({
          type: MediaEnums.MediaPlayerActions.Play,
          data: {
            mediaPlaybackProgress: mediaPlaybackCurrentPlayingInstance.getPlaybackProgress(),
          },
        });

        this.reportMediaPlaybackProgress();
      });
  }

  toggleMediaPlayback(): void {
    const {
      mediaPlayer,
    } = store.getState();

    const {
      mediaPlaybackState,
    } = mediaPlayer;

    if (mediaPlaybackState === MediaEnums.MediaPlaybackState.Playing) {
      this.pauseMediaPlayer();
    } else {
      this.resumeMediaPlayer();
    }
  }

  stopMediaPlayer(): void {
    const {
      mediaPlayer,
    } = store.getState();

    const {
      mediaPlaybackCurrentMediaTrack,
      mediaPlaybackCurrentPlayingInstance,
    } = mediaPlayer;

    if (!mediaPlaybackCurrentMediaTrack || !mediaPlaybackCurrentPlayingInstance) {
      return;
    }

    mediaPlaybackCurrentPlayingInstance
      .stopPlayback()
      .then((mediaPlaybackStopped) => {
        if (!mediaPlaybackStopped) {
          // TODO: Handle cases where media playback could not be stopped
          return;
        }

        store.dispatch({
          type: MediaEnums.MediaPlayerActions.StopPlayer,
        });
      });
  }

  toggleShuffle(): void {
    const {
      mediaPlayer,
    } = store.getState();

    const {
      mediaTracks,
      mediaPlaybackCurrentMediaTrack,
      mediaPlaybackCurrentTrackList,
      mediaPlaybackQueueOnShuffle,
    } = mediaPlayer;

    const mediaPlaybackQueueShuffleEnabled = !mediaPlaybackQueueOnShuffle;

    // important - when shuffle is requested, only the tracks except the current one are shuffled
    // the current one then is always placed first and rest of the list is filled with shuffled tracks
    let mediaQueueTracks: IMediaQueueTrack[] = [];
    if (mediaPlaybackQueueShuffleEnabled) {
      if (mediaPlaybackCurrentMediaTrack) {
        const mediaTracksToShuffle = _.filter(mediaTracks, mediaTrack => mediaTrack.queue_entry_id !== mediaPlaybackCurrentMediaTrack.queue_entry_id);
        const mediaTracksShuffled = this.getShuffledMediaTracks(mediaTracksToShuffle);

        mediaQueueTracks = [mediaPlaybackCurrentMediaTrack, ...mediaTracksShuffled];
      } else {
        mediaQueueTracks = this.getShuffledMediaTracks(mediaTracks);
      }
    } else {
      mediaQueueTracks = this.getSortedMediaTracks(mediaTracks);
    }

    // important - dispatch in batch to avoid re-renders
    // we are going to update tracks first, then the shuffle state
    batch(() => {
      this.loadMediaQueueTracks(mediaQueueTracks, mediaPlaybackCurrentTrackList);
      this.setShuffle(mediaPlaybackQueueShuffleEnabled);
    });
  }

  setShuffle(mediaPlaybackQueueOnShuffle: boolean): void {
    store.dispatch({
      type: MediaEnums.MediaPlayerActions.SetShuffle,
      data: {
        mediaPlaybackQueueOnShuffle,
      },
    });
  }

  toggleRepeat(): void {
    const {
      mediaPlayer,
    } = store.getState();

    const {
      mediaPlaybackQueueRepeatType,
    } = mediaPlayer;

    let mediaPlaybackQueueUpdatedRepeatType;
    if (!mediaPlaybackQueueRepeatType) {
      mediaPlaybackQueueUpdatedRepeatType = MediaEnums.MediaPlaybackRepeatType.Queue;
    } else if (mediaPlaybackQueueRepeatType === MediaEnums.MediaPlaybackRepeatType.Queue) {
      mediaPlaybackQueueUpdatedRepeatType = MediaEnums.MediaPlaybackRepeatType.Track;
    }

    this.setRepeat(mediaPlaybackQueueUpdatedRepeatType);
  }

  setRepeat(mediaPlaybackQueueRepeatType?: MediaEnums.MediaPlaybackRepeatType): void {
    store.dispatch({
      type: MediaEnums.MediaPlayerActions.SetRepeat,
      data: {
        mediaPlaybackQueueRepeatType,
      },
    });
  }

  // media volume control API

  changeMediaPlayerVolume(mediaPlaybackVolume: number): void {
    this.changePlaybackVolumeAsync(mediaPlaybackVolume)
      .then((mediaPlaybackVolumeChanged) => {
        if (!mediaPlaybackVolumeChanged) {
          // TODO: Handle cases where media playback volume could not be changed
        }
      });
  }

  muteMediaPlayerVolume(): void {
    this.mutePlaybackVolumeAsync()
      .then((mediaPlaybackVolumeMuted) => {
        if (!mediaPlaybackVolumeMuted) {
          // TODO: Handle cases where media playback could not be muted
        }
      });
  }

  unmuteMediaPlayerVolume(): void {
    this.unmutePlaybackVolumeAsync()
      .then((mediaPlaybackVolumeUnmuted) => {
        if (!mediaPlaybackVolumeUnmuted) {
          // TODO: Handle cases where media playback could not be un-muted
        }
      });
  }

  // media track control API

  seekMediaTrack(mediaTrackSeekPosition: number): void {
    const {
      mediaPlayer,
    } = store.getState();

    const {
      mediaPlaybackState,
      mediaPlaybackCurrentMediaTrack,
      mediaPlaybackCurrentPlayingInstance,
    } = mediaPlayer;

    if (!mediaPlaybackCurrentMediaTrack || !mediaPlaybackCurrentPlayingInstance) {
      return;
    }

    // update playback progress state to the requested one right away
    // this is being done in order to prevent delay between seek request and actual audio seek success response
    this.updateMediaPlaybackProgress(mediaTrackSeekPosition);

    mediaPlaybackCurrentPlayingInstance
      .seekPlayback(mediaTrackSeekPosition)
      .then((mediaPlaybackSeeked) => {
        if (!mediaPlaybackSeeked) {
          // TODO: Handle cases where media playback could not be seeked
          return;
        }

        if (mediaPlaybackState === MediaEnums.MediaPlaybackState.Playing) {
          // only request progress update if track is currently playing
          // this is being done in order to avoid progress updates if track is already ended
          this.startMediaProgressReporting();
        }
      });
  }

  playPreviousTrack(force?: boolean): void {
    const {
      mediaPlayer,
    } = store.getState();

    const {
      mediaPlaybackCurrentMediaTrack,
      mediaPlaybackCurrentMediaProgress,
    } = mediaPlayer;

    // we will be seeking current track to 0 if:
    // - we don't have any previous track in the queue
    // - or, action was not forced and the track has progressed for more than 15 seconds
    // otherwise, we will be playing the previous track in queue

    if (!this.hasPreviousTrack() || (!force
      && mediaPlaybackCurrentMediaTrack
      && mediaPlaybackCurrentMediaProgress
      && mediaPlaybackCurrentMediaProgress > 15)) {
      this.seekMediaTrack(0);
    } else {
      this.pauseMediaPlayer();
      this.playPrevious();
    }
  }

  playNextTrack(): void {
    this.pauseMediaPlayer();
    this.removeTrackRepeat();
    this.playNext();
  }

  hasPreviousTrack(): boolean {
    return !_.isNil(this.getPreviousFromList());
  }

  hasNextTrack(): boolean {
    return !_.isNil(this.getNextFromList());
  }

  private loadMediaTrackToQueue(mediaTrack: IMediaTrack): IMediaQueueTrack {
    const mediaQueueTrack = this.getMediaQueueTrack(mediaTrack);

    store.dispatch({
      type: MediaEnums.MediaPlayerActions.SetTrack,
      data: {
        mediaTrack: mediaQueueTrack,
      },
    });

    return mediaQueueTrack;
  }

  private loadMediaTracksToQueue(mediaTracks: IMediaTrack[], mediaTrackList?: IMediaTrackList, mediaTrackPointerToPreserve?: number): IMediaQueueTrack[] {
    const {
      mediaPlayer,
    } = store.getState();

    const {
      mediaPlaybackQueueOnShuffle,
    } = mediaPlayer;

    const mediaQueueTracksForTrackList = mediaTracks.map((
      mediaTrack,
      mediaTrackPointer,
    ) => this.getMediaQueueTrack(mediaTrack, mediaTrackPointer, mediaTrackList));

    let mediaQueueTracks: IMediaQueueTrack[] = [];
    if (mediaPlaybackQueueOnShuffle) {
      // important - when mediaTrackPointerToPreserve is provided, only tracks other than this track
      // are shuffled, this track is then stays on the top of the list
      if (!_.isNil(mediaTrackPointerToPreserve)) {
        const mediaTracksToShuffle = _.filter(mediaQueueTracksForTrackList, (_mediaTrack, mediaTrackPointer) => mediaTrackPointer !== mediaTrackPointerToPreserve);
        const mediaTracksShuffled = this.getShuffledMediaTracks(mediaTracksToShuffle);

        mediaQueueTracks = [mediaQueueTracksForTrackList[mediaTrackPointerToPreserve], ...mediaTracksShuffled];
      } else {
        mediaQueueTracks = this.getShuffledMediaTracks(mediaQueueTracksForTrackList);
      }
    } else {
      mediaQueueTracks = this.getSortedMediaTracks(mediaQueueTracksForTrackList);
    }

    this.loadMediaQueueTracks(mediaQueueTracks, mediaTrackList);

    return mediaQueueTracks;
  }

  private getMediaQueueTrack(mediaTrack: IMediaTrack, mediaTrackPointer?: number, mediaTrackList?: IMediaTrackList): IMediaQueueTrack {
    return {
      ...mediaTrack,
      tracklist_id: mediaTrackList ? mediaTrackList.id : mediaTrack.track_album.id,
      queue_entry_id: StringUtils.generateId(),
      queue_insertion_index: _.isNil(mediaTrackPointer) ? 0 : mediaTrackPointer,
    };
  }

  private loadAndPlayMediaTrack(mediaQueueTrack?: IMediaQueueTrack): void {
    this
      .loadAndPlayMediaTrackAsync(mediaQueueTrack)
      .then((mediaPlayed) => {
        if (!mediaPlayed) {
          // TODO: Handle cases where media could not be played
        }
      });
  }

  private async loadAndPlayMediaTrackAsync(mediaQueueTrack?: IMediaQueueTrack): Promise<boolean> {
    const {
      mediaPlayer,
    } = store.getState();

    const {
      mediaTracks,
    } = mediaPlayer;

    // if no media track was explicitly provided, will load from the first one present in current track list
    const mediaTrackToLoad = mediaQueueTrack || mediaTracks[0];
    if (!mediaTrackToLoad) {
      throw new Error('MediaPlayerService encountered error at loadAndPlayMediaTrack - Could not find any track to load');
    }

    const mediaPlayback = this.loadMediaTrack(mediaTrackToLoad);

    // request media provider to play the track
    debug('loadAndPlayMediaTrack - requesting to play - media track id - %s', mediaTrackToLoad.id);

    const mediaPlayed = await mediaPlayback.play();
    if (!mediaPlayed) {
      return false;
    }

    store.dispatch({
      type: MediaEnums.MediaPlayerActions.Play,
      data: {
        mediaPlaybackProgress: mediaPlayback.getPlaybackProgress(),
      },
    });

    this.reportMediaPlaybackProgress();
    return true;
  }

  private async changePlaybackVolumeAsync(mediaPlaybackVolume: number): Promise<boolean> {
    const {
      mediaPlayer,
    } = store.getState();

    const {
      mediaPlaybackCurrentPlayingInstance,
      mediaPlaybackVolumeMaxLimit,
      mediaPlaybackVolumeMuted,
    } = mediaPlayer;

    if (mediaPlaybackVolume > 0 && mediaPlaybackVolumeMuted) {
      // raising the volume above 0 will unmute the muted audio as well
      // unmute playback
      if (mediaPlaybackCurrentPlayingInstance) {
        const mediaPlaybackVolumeUnmuted = await mediaPlaybackCurrentPlayingInstance.unmutePlaybackVolume();
        if (!mediaPlaybackVolumeUnmuted) {
          return false;
        }
      }
      // update state
      store.dispatch({
        type: MediaEnums.MediaPlayerActions.UnmutePlaybackVolume,
      });
    }

    if (mediaPlaybackCurrentPlayingInstance) {
      // change playback volume
      const mediaPlaybackVolumeChanged = mediaPlaybackCurrentPlayingInstance.changePlaybackVolume(
        mediaPlaybackVolume,
        mediaPlaybackVolumeMaxLimit,
      );
      if (!mediaPlaybackVolumeChanged) {
        return false;
      }
    }

    // update state
    store.dispatch({
      type: MediaEnums.MediaPlayerActions.UpdatePlaybackVolume,
      data: {
        mediaPlaybackVolume,
      },
    });

    return true;
  }

  private async mutePlaybackVolumeAsync(): Promise<boolean> {
    const {
      mediaPlayer,
    } = store.getState();

    const {
      mediaPlaybackCurrentPlayingInstance,
      mediaPlaybackVolumeMuted,
    } = mediaPlayer;

    if (mediaPlaybackVolumeMuted) {
      return true;
    }

    // mute playback
    if (mediaPlaybackCurrentPlayingInstance) {
      const mediaPlaybackVolumeWasMuted = mediaPlaybackCurrentPlayingInstance.mutePlaybackVolume();
      if (!mediaPlaybackVolumeWasMuted) {
        return false;
      }
    }

    // update state
    store.dispatch({
      type: MediaEnums.MediaPlayerActions.MutePlaybackVolume,
    });

    return true;
  }

  private async unmutePlaybackVolumeAsync(): Promise<boolean> {
    const {
      mediaPlayer,
    } = store.getState();

    const {
      mediaPlaybackCurrentPlayingInstance,
      mediaPlaybackVolumeMuted,
    } = mediaPlayer;

    if (!mediaPlaybackVolumeMuted) {
      return true;
    }

    // unmute playback
    if (mediaPlaybackCurrentPlayingInstance) {
      const mediaPlaybackVolumeWasUnmuted = mediaPlaybackCurrentPlayingInstance.unmutePlaybackVolume();
      if (!mediaPlaybackVolumeWasUnmuted) {
        return false;
      }
    }

    // update state
    store.dispatch({
      type: MediaEnums.MediaPlayerActions.UnmutePlaybackVolume,
    });

    return true;
  }

  private startMediaProgressReporting() {
    // reset the retry count so that we can retry again in case of further failures
    this.mediaProgressReportCurrentRetryCount = 0;

    // using setTimeout instead of requestAnimationFrame as setTimeout also works when app is in background
    setTimeout(() => {
      this.reportMediaPlaybackProgress();
    });
  }

  private reportMediaPlaybackProgress(): void {
    const {
      mediaPlayer,
    } = store.getState();

    const {
      mediaPlaybackCurrentMediaTrack,
      mediaPlaybackCurrentPlayingInstance,
    } = mediaPlayer;

    if (!mediaPlaybackCurrentMediaTrack || !mediaPlaybackCurrentPlayingInstance) {
      debug('reportMediaPlaybackProgress - no running media instance found, aborting...');
      return;
    }

    const mediaPlaybackProgress = mediaPlaybackCurrentPlayingInstance.getPlaybackProgress();
    this.updateMediaPlaybackProgress(mediaPlaybackProgress);

    if (mediaPlaybackCurrentPlayingInstance.checkIfPlaying()) {
      this.startMediaProgressReporting();
    } else if (mediaPlaybackCurrentPlayingInstance.checkIfLoading()) {
      debug('reportMediaPlaybackProgress - media playback loading, waiting...');

      // first update the playback state
      store.dispatch({
        type: MediaEnums.MediaPlayerActions.LoadingTrack,
      });

      // re-request update
      this.startMediaProgressReporting();
    } else if (mediaPlaybackCurrentPlayingInstance.checkIfEnded()) {
      debug('reportMediaPlaybackProgress - media playback ended, playing next...');
      this.pauseMediaPlayer();
      this.playNext();
    } else if (!this.retryMediaProgressReporting()) {
      debug('reportMediaPlaybackProgress - media instance did not reported valid state, aborting...');
      this.pauseMediaPlayer();
    }
  }

  private updateMediaPlaybackProgress(mediaPlaybackProgress: number): void {
    const {
      mediaPlayer,
    } = store.getState();

    const {
      mediaPlaybackCurrentMediaProgress = 0,
    } = mediaPlayer;

    if (mediaPlaybackCurrentMediaProgress === mediaPlaybackProgress) {
      return;
    }

    debug('updateMediaPlaybackProgress - updating progress - existing - %d, new - %d', mediaPlaybackCurrentMediaProgress, mediaPlaybackProgress);

    store.dispatch({
      type: MediaEnums.MediaPlayerActions.UpdatePlaybackProgress,
      data: {
        mediaPlaybackProgress,
      },
    });
  }

  private retryMediaProgressReporting(): boolean {
    if (!(this.mediaProgressReportCurrentRetryCount < this.mediaProgressReportRetryCount)) {
      return false;
    }

    this.mediaProgressReportCurrentRetryCount += 1;
    debug('retryMediaProgressReporting - retrying - current count - %d, total count - %d', this.mediaProgressReportCurrentRetryCount, this.mediaProgressReportRetryCount);

    setTimeout(() => {
      this.reportMediaPlaybackProgress();
    }, this.mediaProgressReportRetryDelayMS);

    return true;
  }

  private getPreviousFromList(): IMediaQueueTrack | undefined {
    const {
      mediaPlayer,
    } = store.getState();

    const {
      mediaTracks,
      mediaPlaybackCurrentMediaTrack,
    } = mediaPlayer;

    let mediaTrack;
    if (!_.isEmpty(mediaTracks) && mediaPlaybackCurrentMediaTrack) {
      const mediaCurrentTrackPointer = _.findIndex(
        mediaTracks,
        track => track.queue_entry_id === mediaPlaybackCurrentMediaTrack.queue_entry_id,
      );
      if (!_.isNil(mediaCurrentTrackPointer) && mediaCurrentTrackPointer > 0) {
        mediaTrack = mediaTracks[mediaCurrentTrackPointer - 1];
      }
    }

    return mediaTrack;
  }

  private playPrevious(): void {
    debug('playPrevious - attempting to play previous...');

    const mediaTrack = this.getPreviousFromList();
    if (!mediaTrack) {
      debug('playPrevious - media previous track could not be obtained, skipping play previous...');
      return;
    }

    debug('playNext - found track to play - %s', mediaTrack.id);

    this.loadAndPlayMediaTrack(mediaTrack);
  }

  private getNextFromList(): IMediaQueueTrack | undefined {
    const {
      mediaPlayer,
    } = store.getState();

    const {
      mediaTracks,
      mediaPlaybackCurrentMediaTrack,
    } = mediaPlayer;

    let mediaTrack;
    if (!_.isEmpty(mediaTracks) && mediaPlaybackCurrentMediaTrack) {
      const mediaCurrentTrackPointer = _.findIndex(
        mediaTracks,
        track => track.queue_entry_id === mediaPlaybackCurrentMediaTrack.queue_entry_id,
      );
      if (!_.isNil(mediaCurrentTrackPointer) && mediaCurrentTrackPointer < mediaTracks.length - 1) {
        mediaTrack = mediaTracks[mediaCurrentTrackPointer + 1];
      }
    }

    return mediaTrack;
  }

  private playNext(): void {
    const {
      mediaPlayer,
    } = store.getState();

    const {
      mediaTracks,
      mediaPlaybackCurrentMediaTrack,
      mediaPlaybackQueueRepeatType,
    } = mediaPlayer;

    debug('playNext - attempting to play next - queue length - %d', mediaTracks.length);

    // procedure to determine what to play next:
    // - if repeat is set to 'track' and we have a media track loaded, play it
    // otherwise get the next from list, and:
    // - if media track was found from the list, play the same
    // - otherwise if repeat is set to 'queue' and list is not empty, play the first track from queue
    // - else simply load (not play!) the first track from the queue if it's not the same as the current track

    if (mediaPlaybackQueueRepeatType === MediaEnums.MediaPlaybackRepeatType.Track && mediaPlaybackCurrentMediaTrack) {
      debug('playNext - repeating track - track id %s, queue entry id - %s', mediaPlaybackCurrentMediaTrack.id, mediaPlaybackCurrentMediaTrack.queue_entry_id);
      this.playMediaTrackFromQueue(mediaPlaybackCurrentMediaTrack);
    } else {
      const mediaTrackNextInQueue = this.getNextFromList();

      if (mediaTrackNextInQueue) {
        debug('playNext - found track to play - track id %s, queue entry id - %s', mediaTrackNextInQueue.id, mediaTrackNextInQueue.queue_entry_id);
        this.playMediaTrackFromQueue(mediaTrackNextInQueue);
      } else if (mediaPlaybackQueueRepeatType === MediaEnums.MediaPlaybackRepeatType.Queue && mediaTracks[0]) {
        debug('playNext - playing queue from beginning - track id %s, queue entry id - %s', mediaTracks[0].id, mediaTracks[0].queue_entry_id);
        this.playMediaTrackFromQueue(mediaTracks[0]);
      } else if (mediaPlaybackCurrentMediaTrack
        && mediaTracks[0]
        && mediaPlaybackCurrentMediaTrack.queue_entry_id !== mediaTracks[0].queue_entry_id) {
        debug('playNext - loading track - track id %s, queue entry id - %s', mediaTracks[0].id, mediaTracks[0].queue_entry_id);
        this.loadMediaTrack(mediaTracks[0]);
      }
    }
  }

  private removeTrackRepeat() {
    const {
      mediaPlayer,
    } = store.getState();

    const {
      mediaPlaybackQueueRepeatType,
    } = mediaPlayer;

    if (mediaPlaybackQueueRepeatType === MediaEnums.MediaPlaybackRepeatType.Track) {
      store.dispatch({
        type: MediaEnums.MediaPlayerActions.SetRepeat,
        data: {
          mediaPlaybackQueueRepeatType: MediaEnums.MediaPlaybackRepeatType.Queue,
        },
      });
    }
  }

  private getShuffledMediaTracks(mediaTracks: IMediaQueueTrack[]): IMediaQueueTrack[] {
    return ArrayUtils.shuffleArray(mediaTracks);
  }

  private getSortedMediaTracks(mediaTracks: IMediaQueueTrack[]): IMediaQueueTrack[] {
    return _.sortBy(mediaTracks, mediaTrack => mediaTrack.queue_insertion_index);
  }
}

export default new MediaPlayerService();

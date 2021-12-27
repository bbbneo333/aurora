import * as _ from 'lodash';
import {batch} from 'react-redux';

import {MediaEnums} from '../enums';
import store from '../store';
import {ArrayUtils, StringUtils} from '../utils';

import {
  IMediaPlayback,
  IMediaQueueTrack,
  IMediaTrack,
  IMediaTrackList,
} from '../interfaces';

import MediaProviderService from './media-provider.service';

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

      // stop media player
      debug('playMediaTrack - stopping - media track id - %s', mediaPlaybackCurrentMediaTrack.id);
      this.stopMediaPlayer();
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

      // stop media player
      debug('playMediaTrack - stopping - media track id - %s', mediaPlaybackCurrentMediaTrack.id);
      this.stopMediaPlayer();
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
    } = mediaPlayer;

    if (mediaPlaybackCurrentMediaTrack && mediaPlaybackCurrentPlayingInstance) {
      // resume media playback if we are playing same tracklist
      if (mediaPlaybackCurrentTrackList?.id === mediaTrackList?.id && mediaPlaybackCurrentMediaTrack.id === mediaTrack.id) {
        debug('playMediaTrack - resuming - media track id - %s', mediaPlaybackCurrentMediaTrack.id);
        this.resumeMediaPlayer();
        return;
      }

      // stop media player
      debug('playMediaTrack - stopping - media track id - %s', mediaPlaybackCurrentMediaTrack.id);
      this.stopMediaPlayer();
    }

    // add tracks to the queue
    // important - setting tracks will remove all existing ones
    const mediaQueueTracks = this.loadMediaTracksToQueue(mediaTracks, mediaTrackList);

    // request media provider to load and play the track
    this.loadAndPlayMediaTrack(mediaQueueTracks[mediaTrackPointer]);
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

    // stop current playing instance
    this.stopMediaPlayer();

    // load up and play found track from queue
    this.loadAndPlayMediaTrack(mediaQueueTrack);
  }

  // addMediaTrackToQueue(mediaTrack: IMediaTrack) {
  //   // TODO: Add support
  // }

  loadMediaTrack(mediaQueueTrack: IMediaTrack): IMediaPlayback {
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
    const {mediaPlaybackService} = MediaProviderService.getMediaProvider(mediaQueueTrack.provider);
    const mediaPlayback = mediaPlaybackService.playMediaTrack(mediaQueueTrack, {
      mediaPlaybackVolume: mediaPlaybackVolumeCurrent,
      mediaPlaybackMaxVolume: mediaPlaybackVolumeMaxLimit,
      mediaPlaybackVolumeMuted,
    });

    // load the track
    store.dispatch({
      type: MediaEnums.MediaPlayerActions.LoadTrack,
      data: {
        mediaTrackId: mediaQueueTrack.id,
        mediaPlayingInstance: mediaPlayback,
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

  // media player control API

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

  // media playback control API

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
      this.stopMediaPlayer();
      this.playPrevious();
    }
  }

  playNextTrack(): void {
    this.stopMediaPlayer();
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
    const mediaQueueTrack = {
      ...mediaTrack,
      tracklist_id: mediaTrack.track_album.id,
      queue_entry_id: StringUtils.generateId(),
      queue_insertion_index: 0,
    };

    store.dispatch({
      type: MediaEnums.MediaPlayerActions.SetTrack,
      data: {
        mediaTrack: mediaQueueTrack,
      },
    });

    return mediaQueueTrack;
  }

  private loadMediaTracksToQueue(mediaTracks: IMediaTrack[], mediaTrackList?: IMediaTrackList): IMediaQueueTrack[] {
    const {
      mediaPlayer,
    } = store.getState();

    const {
      mediaPlaybackQueueOnShuffle,
    } = mediaPlayer;

    const mediaQueueTracksForTrackList = mediaTracks.map((mediaTrack, mediaTrackPointer) => ({
      ...mediaTrack,
      tracklist_id: mediaTrackList ? mediaTrackList.id : mediaTrack.track_album.id,
      queue_entry_id: StringUtils.generateId(),
      queue_insertion_index: mediaTrackPointer,
    }));

    const mediaQueueTracks = mediaPlaybackQueueOnShuffle
      ? this.getShuffledMediaTracks(mediaQueueTracksForTrackList)
      : this.getSortedMediaTracks(mediaQueueTracksForTrackList);

    this.loadMediaQueueTracks(mediaQueueTracks, mediaTrackList);

    return mediaQueueTracks;
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

      // first stop the current playing track (only the state)
      store.dispatch({
        type: MediaEnums.MediaPlayerActions.StopPlayer,
      });

      // request next track
      this.playNext();
    } else if (!this.retryMediaProgressReporting()) {
      debug('reportMediaPlaybackProgress - media instance did not reported valid state, aborting...');
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
      const mediaCurrentTrackPointer = _.findIndex(mediaTracks, track => track.id === mediaPlaybackCurrentMediaTrack.id);
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
      const mediaCurrentTrackPointer = _.findIndex(mediaTracks, track => track.id === mediaPlaybackCurrentMediaTrack.id);
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

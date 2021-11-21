import * as _ from 'lodash';

import {MediaEnums} from '../enums';
import store from '../store';

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
    store.dispatch({
      type: MediaEnums.MediaPlayerActions.SetTrack,
      data: {
        mediaTrack,
      },
    });

    // request media provider to load the track
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
    store.dispatch({
      type: MediaEnums.MediaPlayerActions.SetTracks,
      data: {
        mediaTracks,
        mediaTrackList,
      },
    });

    // request media provider to load the track
    this.loadAndPlayMediaTrack();
  }

  playMediaTrackFromList(mediaTracks: IMediaTrack[], mediaTrackId: string, mediaTrackList?: IMediaTrackList): void {
    if (_.isEmpty(mediaTracks)) {
      throw new Error('MediaPlayerService encountered error at playMediaTracks - Empty track list was provided');
    }

    const mediaTrack = mediaTracks.find(track => track.id === mediaTrackId);
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
    store.dispatch({
      type: MediaEnums.MediaPlayerActions.SetTracks,
      data: {
        mediaTracks,
        mediaTrackList,
      },
    });

    // request media provider to load the track
    this.loadAndPlayMediaTrack(mediaTrack);
  }

  playMediaTrackFromQueue(mediaTrack: IMediaTrack) {
    const {
      mediaPlayer,
    } = store.getState();

    const {
      mediaPlaybackCurrentMediaTrack,
    } = mediaPlayer;

    // if the current media track is same as provided one, simply resume and conclude
    if (mediaPlaybackCurrentMediaTrack && mediaPlaybackCurrentMediaTrack.id === mediaTrack.id) {
      this.resumeMediaPlayer();
      return;
    }

    // stop current playing instance
    this.stopMediaPlayer();

    // load up and play found track from queue
    this.loadAndPlayMediaTrack(mediaTrack);
  }

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

  startMediaProgressReporting() {
    // reset the retry count so that we can retry again in case of further failures
    this.mediaProgressReportCurrentRetryCount = 0;

    // using setTimeout instead of requestAnimationFrame as setTimeout also works when app is in background
    setTimeout(() => {
      this.reportMediaPlaybackProgress();
    });
  }

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
      type: MediaEnums.MediaPlayerActions.LoadExistingTrack,
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

  changeMediaPlayerVolume(mediaPlaybackVolume: number): void {
    const {
      mediaPlayer,
    } = store.getState();

    const {
      mediaPlaybackCurrentMediaTrack,
      mediaPlaybackCurrentPlayingInstance,
      mediaPlaybackVolumeMaxLimit,
      mediaPlaybackVolumeMuted,
    } = mediaPlayer;

    async function changeVolume() {
      if (!mediaPlaybackCurrentMediaTrack || !mediaPlaybackCurrentPlayingInstance) {
        return false;
      }

      // raising the volume above 0 will unmute the muted audio as well
      if (mediaPlaybackVolume > 0 && mediaPlaybackVolumeMuted) {
        const mediaPlaybackVolumeUnMuted = await mediaPlaybackCurrentPlayingInstance.unmutePlaybackVolume();
        if (!mediaPlaybackVolumeUnMuted) {
          return false;
        }
      }
      // change the volume
      const mediaPlaybackVolumeChanged = await mediaPlaybackCurrentPlayingInstance.changePlaybackVolume(mediaPlaybackVolume, mediaPlaybackVolumeMaxLimit);
      if (!mediaPlaybackVolumeChanged) {
        return false;
      }

      store.dispatch({
        type: MediaEnums.MediaPlayerActions.UpdatePlaybackVolume,
        data: {
          mediaPlaybackVolume,
        },
      });

      return true;
    }

    changeVolume()
      .then((mediaPlaybackVolumeChanged) => {
        if (!mediaPlaybackVolumeChanged) {
          // TODO: Handle cases where media playback volume could not be changed
        }
      });
  }

  muteMediaPlayerVolume(): void {
    const {
      mediaPlayer,
    } = store.getState();

    const {
      mediaPlaybackCurrentMediaTrack,
      mediaPlaybackCurrentPlayingInstance,
      mediaPlaybackVolumeMuted,
    } = mediaPlayer;

    if (!mediaPlaybackCurrentMediaTrack
      || !mediaPlaybackCurrentPlayingInstance
      || mediaPlaybackVolumeMuted) {
      return;
    }

    mediaPlaybackCurrentPlayingInstance
      .mutePlaybackVolume()
      .then((mediaPlaybackMuted) => {
        if (!mediaPlaybackMuted) {
          // TODO: Handle cases where media playback could not be muted
          return;
        }

        store.dispatch({
          type: MediaEnums.MediaPlayerActions.MutePlaybackVolume,
        });
      });
  }

  unmuteMediaPlayerVolume(): void {
    const {
      mediaPlayer,
    } = store.getState();

    const {
      mediaPlaybackCurrentMediaTrack,
      mediaPlaybackCurrentPlayingInstance,
      mediaPlaybackVolumeMuted,
    } = mediaPlayer;

    if (!mediaPlaybackCurrentMediaTrack
      || !mediaPlaybackCurrentPlayingInstance
      || !mediaPlaybackVolumeMuted) {
      return;
    }

    mediaPlaybackCurrentPlayingInstance
      .unmutePlaybackVolume()
      .then((mediaPlaybackUnMuted) => {
        if (!mediaPlaybackUnMuted) {
          // TODO: Handle cases where media playback could not be un-muted
          return;
        }

        store.dispatch({
          type: MediaEnums.MediaPlayerActions.UnmutePlaybackVolume,
        });
      });
  }

  playPreviousTrack(): void {
    this.stopMediaPlayer();
    this.playPrevious();
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

  toggleShuffle(): void {
    const {
      mediaPlayer,
    } = store.getState();

    const {
      mediaPlaybackQueueOnShuffle,
    } = mediaPlayer;

    store.dispatch({
      type: MediaEnums.MediaPlayerActions.SetShuffle,
      data: {
        mediaPlaybackQueueOnShuffle: !mediaPlaybackQueueOnShuffle,
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

    store.dispatch({
      type: MediaEnums.MediaPlayerActions.SetRepeat,
      data: {
        mediaPlaybackQueueRepeatType: mediaPlaybackQueueUpdatedRepeatType,
      },
    });
  }

  private loadAndPlayMediaTrack(mediaTrack?: IMediaTrack): void {
    this
      .loadAndPlayMediaTrackAsync(mediaTrack)
      .then((mediaPlayed) => {
        if (!mediaPlayed) {
          // TODO: Handle cases where media could not be played
        }
      });
  }

  private async loadAndPlayMediaTrackAsync(mediaTrack?: IMediaTrack): Promise<boolean> {
    const {
      mediaPlayer,
    } = store.getState();

    const {
      mediaTracks,
    } = mediaPlayer;

    // if no media track was explicitly provided, will load from the first one present in current track list
    const mediaTrackToLoad = mediaTrack || mediaTracks[0];
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

  private loadMediaTrack(mediaTrack: IMediaTrack): IMediaPlayback {
    const {
      mediaPlayer,
    } = store.getState();

    const {
      mediaPlaybackVolumeCurrent,
      mediaPlaybackVolumeMaxLimit,
    } = mediaPlayer;

    // loading a media track will always remove the track repeat
    this.removeTrackRepeat();

    const {mediaPlaybackService} = MediaProviderService.getMediaProvider(mediaTrack.provider);
    const mediaPlayback = mediaPlaybackService.playMediaTrack(mediaTrack, {
      mediaPlaybackVolume: mediaPlaybackVolumeCurrent,
      mediaPlaybackMaxVolume: mediaPlaybackVolumeMaxLimit,
    });

    store.dispatch({
      type: MediaEnums.MediaPlayerActions.LoadTrack,
      data: {
        mediaTrackId: mediaTrack.id,
        mediaPlayingInstance: mediaPlayback,
      },
    });

    return mediaPlayback;
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
        type: MediaEnums.MediaPlayerActions.LoadExistingTrack,
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

  private getPreviousFromList(): IMediaTrack | undefined {
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
        // important - loading the media tracks sets playback state in 'loading', explicitly request a pause to
        // proceed further 'loading'

        debug('playNext - loading track - track id %s, queue entry id - %s', mediaTracks[0].id, mediaTracks[0].queue_entry_id);
        this.loadMediaTrack(mediaTracks[0]);
        this.pauseMediaPlayer();
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
}

export default new MediaPlayerService();

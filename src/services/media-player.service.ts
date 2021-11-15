import * as _ from 'lodash';

import {MediaEnums} from '../enums';
import {IMediaTrack} from '../interfaces';
import {MediaTrackList} from '../reducers/media-player.reducer';
import store from '../store';

import MediaProviderService from './media-provider.service';

const debug = require('debug')('app:service:media_player_service');

class MediaPlayerService {
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
    debug('playMediaTrack - loading - media track id - %s', mediaTrack.id);
    this
      .loadAndPlayMediaTrack(mediaTrack)
      .then((mediaPlayed) => {
        if (!mediaPlayed) {
          // TODO: Handle cases where media could not be played
        }
      });
  }

  playMediaTracks(mediaTracks: IMediaTrack[], mediaTrackList?: MediaTrackList): void {
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
      if (mediaPlaybackCurrentTrackList && mediaTrackList && mediaPlaybackCurrentTrackList.id === mediaTrackList.id) {
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
    // we will always be playing the initial track first from the list
    const mediaTrack = mediaTracks[0];
    debug('playMediaTrack - loading - media track id - %s', mediaTrack.id);
    this
      .loadAndPlayMediaTrack(mediaTrack)
      .then((mediaPlayed) => {
        if (!mediaPlayed) {
          // TODO: Handle cases where media could not be played
        }
      });
  }

  playMediaTrackFromList(mediaTracks: IMediaTrack, mediaTrackId: string, mediaTrackList?: MediaTrackList): void {
    debug('playMediaTrackFromList received - %o - %s - %s', mediaTracks, mediaTrackId, mediaTrackList);
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
          requestAnimationFrame(() => {
            this.reportMediaPlaybackProgress();
          });
        }
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

  private async loadAndPlayMediaTrack(mediaTrack: IMediaTrack): Promise<boolean> {
    const {
      mediaPlayer,
    } = store.getState();

    const {
      mediaPlaybackVolumeCurrent,
      mediaPlaybackVolumeMaxLimit,
    } = mediaPlayer;

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

    // request media provider to play the track
    debug('playMediaTrack - playing - media track id - %s', mediaTrack.id);

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

  private reportMediaPlaybackProgress(): void {
    const {
      mediaPlayer,
    } = store.getState();

    const {
      mediaPlaybackCurrentMediaTrack,
      mediaPlaybackCurrentMediaProgress,
      mediaPlaybackCurrentPlayingInstance,
    } = mediaPlayer;

    if (!mediaPlaybackCurrentMediaTrack || !mediaPlaybackCurrentPlayingInstance) {
      debug('reportMediaPlaybackProgress - no running media instance found, aborting...');
      return;
    }

    const mediaPlaybackExistingProgress = mediaPlaybackCurrentMediaProgress || 0;
    const mediaPlaybackProgress = mediaPlaybackCurrentPlayingInstance.getPlaybackProgress();

    if (mediaPlaybackExistingProgress !== mediaPlaybackProgress) {
      debug('reportMediaPlaybackProgress - reporting progress - existing - %d, new - %d', mediaPlaybackExistingProgress, mediaPlaybackProgress);
      this.updateMediaPlaybackProgress(mediaPlaybackProgress);
    }

    if (mediaPlaybackCurrentPlayingInstance.checkIfPlaying()) {
      requestAnimationFrame(() => {
        this.reportMediaPlaybackProgress();
      });
    } else if (mediaPlaybackCurrentPlayingInstance.checkIfLoading()) {
      debug('reportMediaPlaybackProgress - media playback loading, waiting...');

      // first update the playback state
      store.dispatch({
        type: MediaEnums.MediaPlayerActions.LoadExistingTrack,
      });

      // re-request update
      requestAnimationFrame(() => {
        this.reportMediaPlaybackProgress();
      });
    } else if (mediaPlaybackCurrentPlayingInstance.checkIfEnded()) {
      debug('reportMediaPlaybackProgress - media playback ended, playing next...');

      // first stop the current playing track (only the state)
      store.dispatch({
        type: MediaEnums.MediaPlayerActions.StopPlayer,
      });

      // request next track
      this.playNext();
    } else {
      debug('reportMediaPlaybackProgress - media instance did not reported valid state, aborting...');
    }
  }

  private updateMediaPlaybackProgress(mediaPlaybackProgress: number): void {
    store.dispatch({
      type: MediaEnums.MediaPlayerActions.UpdatePlaybackProgress,
      data: {
        mediaPlaybackProgress,
      },
    });
  }

  private playNext(): void {
    const {
      mediaPlayer,
    } = store.getState();

    const {
      mediaTracks,
      mediaPlaybackCurrentMediaTrack,
    } = mediaPlayer;

    debug('playNext - attempting to play next - track list length - %d, current media track - %s', mediaTracks.length, mediaPlaybackCurrentMediaTrack?.id);

    let mediaNextTrack;
    if (!_.isEmpty(mediaTracks) && mediaPlaybackCurrentMediaTrack) {
      const mediaCurrentTrackPointer = _.findIndex(mediaTracks, mediaTrack => mediaTrack.id === mediaPlaybackCurrentMediaTrack.id);
      if (!_.isNil(mediaCurrentTrackPointer) && mediaCurrentTrackPointer < mediaTracks.length) {
        mediaNextTrack = mediaTracks[mediaCurrentTrackPointer + 1];
      }
    }
    if (!mediaNextTrack) {
      debug('playNext - media next track could not be obtained, skipping play next...');
      return;
    }

    debug('playNext - found track to play next - %s', mediaNextTrack.id);

    this
      .loadAndPlayMediaTrack(mediaNextTrack)
      .then((mediaPlayed) => {
        if (!mediaPlayed) {
          // TODO: Handle cases where media could not be played
        }
      });
  }
}

export default new MediaPlayerService();

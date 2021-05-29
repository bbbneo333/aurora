import {MediaEnums} from '../enums';
import {IMediaTrack} from '../interfaces';

import MediaProviderService from './media-provider.service';

import store from '../store';

const debug = require('debug')('app:service:media_player_service');

class MediaPlayerService {
  playMediaTrack(mediaTrack: IMediaTrack): void {
    const {
      mediaPlayer,
    } = store.getState();
    const {
      mediaPlaybackCurrentMediaTrack,
      mediaPlaybackCurrentPlayingInstance,
      mediaPlaybackVolumeMaxLimit,
      mediaPlaybackVolumeCurrent,
    } = mediaPlayer;

    const self = this;

    async function play() {
      if (mediaPlaybackCurrentMediaTrack && mediaPlaybackCurrentPlayingInstance) {
        // resume media playback if we are playing same track
        if (mediaPlaybackCurrentMediaTrack.id === mediaTrack.id) {
          debug('playMediaTrack - resuming - media track id - %s', mediaPlaybackCurrentMediaTrack.id);
          return self.resumeMediaPlayer();
        }

        // stop media player
        debug('playMediaTrack - stopping - media track id - %s', mediaPlaybackCurrentMediaTrack.id);
        const mediaPlaybackStopped = await mediaPlaybackCurrentPlayingInstance.stopPlayback();
        if (!mediaPlaybackStopped) {
          return false;
        }
      }

      // playing a new media track would always clear off the queue
      store.dispatch({
        type: MediaEnums.MediaPlayerActions.ClearTracks,
      });

      // add track to the queue
      store.dispatch({
        type: MediaEnums.MediaPlayerActions.AddTrack,
        data: {
          mediaTrack,
        },
      });

      // request media provider to load the track
      debug('playMediaTrack - loading - media track id - %s', mediaTrack.id);

      const mediaProvider = MediaProviderService.getMediaProvider(mediaTrack.provider);
      const mediaPlayback = mediaProvider.mediaPlaybackService.playMediaTrack(mediaTrack, {
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
          mediaPlaybackDuration: mediaTrack.track_duration,
          mediaPlaybackProgress: mediaPlayback.getPlaybackProgress(),
        },
      });

      requestAnimationFrame(() => {
        self.reportMediaPlaybackProgress();
      });

      return true;
    }

    play()
      .then((mediaPlayed) => {
        if (!mediaPlayed) {
          // TODO: Handle cases where media could not be played
        }
      });
  }

  seekMediaTrack(mediaTrackSeekPosition: number): void {
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
      .seekPlayback(mediaTrackSeekPosition)
      .then((mediaPlaybackSeeked) => {
        if (!mediaPlaybackSeeked) {
          // TODO: Handle cases where media playback could not be seeked
          return;
        }

        requestAnimationFrame(() => {
          this.reportMediaPlaybackProgress();
        });
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
            mediaPlaybackDuration: mediaPlaybackCurrentMediaTrack.track_duration,
            mediaPlaybackProgress: mediaPlaybackCurrentPlayingInstance.getPlaybackProgress(),
          },
        });

        requestAnimationFrame(() => {
          this.reportMediaPlaybackProgress();
        });
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

  private reportMediaPlaybackProgress() {
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

      store.dispatch({
        type: MediaEnums.MediaPlayerActions.UpdatePlaybackProgress,
        data: {
          mediaPlaybackProgress,
        },
      });
    }

    if (mediaPlaybackCurrentPlayingInstance.checkIfPlaying()) {
      requestAnimationFrame(() => {
        this.reportMediaPlaybackProgress();
      });
    }
  }
}

export default new MediaPlayerService();

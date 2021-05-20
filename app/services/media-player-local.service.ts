import * as _ from 'lodash';

// @ts-ignore
import {Howl, HowlOptions} from 'howler';

import {MediaTrack} from '../models';
import {MediaEnums} from '../enums';
import store from '../store';

const debug = require('debug')('app:service:media_player_local_service');

class MediaPlayerLocalService {
  playMediaTrack(mediaTrack: MediaTrack): boolean {
    const {mediaPlayer} = store.getState();
    const self = this;

    // run and store a new audio instance
    const mediaPlaybackLocalAudio = this.playLocalAudio(mediaTrack.location.address, {
      // settings
      volume: self.getVolumeForLocalAudioPlayer(mediaPlayer.mediaPlaybackVolumeCurrent),
      // event listeners
      onplay(mediaPlaybackAudioId: number) {
        const mediaPlaybackDuration = self.getDurationFromAudio(this);
        const mediaPlaybackProgress = self.getProgressFromAudio(this);
        debug('playMediaTrack - audio %s - playback id - %d, duration - %d, progress - %d', 'played', mediaPlaybackAudioId, mediaPlaybackDuration, mediaPlaybackProgress);

        store.dispatch({
          type: MediaEnums.MediaPlayerActions.Play,
          data: {
            mediaPlaybackDuration,
            mediaPlaybackProgress,
          },
        });
        requestAnimationFrame(() => {
          self.reportMediaPlaybackProgress();
        });
      },
      onpause(mediaPlaybackAudioId: number) {
        debug('playMediaTrack - audio %s - playback id - %d', 'paused', mediaPlaybackAudioId);

        store.dispatch({
          type: MediaEnums.MediaPlayerActions.PausePlayer,
        });
      },
      onstop(mediaPlaybackAudioId: number) {
        debug('playMediaTrack - audio %s - playback id - %d', 'stopped', mediaPlaybackAudioId);
      },
      onend(mediaPlaybackAudioId: number) {
        debug('playMediaTrack - audio %s - playback id - %d', 'ended', mediaPlaybackAudioId);

        // TODO: Till we have support from playing via queue, once a track ends, we will seek it to start and pause the player
        this.seek(0);
        self.pausePlayer();
      },
      onseek(mediaPlaybackAudioId: number) {
        const mediaPlaybackProgress = self.getProgressFromAudio(this);
        debug('playMediaTrack - audio %s - playback id - %d, progress - %d', 'seeked', mediaPlaybackAudioId, mediaPlaybackProgress);

        requestAnimationFrame(() => {
          self.reportMediaPlaybackProgress();
        });
      },
      onvolume(mediaPlaybackAudioId: number) {
        const mediaPlaybackSystemVolume = self.getVolumeForSystemAudioPlayer(this.volume());
        debug('playMediaTrack - audio %s - playback id - %d, volume - %d', 'volume', mediaPlaybackAudioId, mediaPlaybackSystemVolume);

        store.dispatch({
          type: MediaEnums.MediaPlayerActions.UpdatePlaybackVolume,
          data: {
            mediaPlaybackVolume: mediaPlaybackSystemVolume,
          },
        });
      },
      onmute(mediaPlaybackAudioId: number) {
        const mediaPlaybackVolumeMuted = this.mute();
        debug('playMediaTrack - audio %s - playback id - %d, muted - %s', 'mute', mediaPlaybackAudioId, mediaPlaybackVolumeMuted);

        store.dispatch({
          type: mediaPlaybackVolumeMuted
            ? MediaEnums.MediaPlayerActions.MutePlaybackVolume
            : MediaEnums.MediaPlayerActions.UnmutePlaybackVolume,
        });
      },
    });

    store.dispatch({
      type: MediaEnums.MediaPlayerActions.LoadTrack,
      data: {
        mediaTrackId: mediaTrack.id,
        mediaPlayingInstance: {
          audio: mediaPlaybackLocalAudio,
        },
      },
    });

    // play returns a unique sound ID that can be passed
    // into any method on Howl to control that specific sound
    const audioPlaybackId = mediaPlaybackLocalAudio.play();
    debug('playMediaTrack - playing track id - %s, playback id - %d', mediaTrack.id, audioPlaybackId);

    return true;
  }

  seekMediaTrack(mediaTrackSeekPosition: number): boolean {
    const {mediaPlayer} = store.getState();

    if (!mediaPlayer.mediaPlaybackCurrentPlayingInstance) {
      return false;
    }

    mediaPlayer.mediaPlaybackCurrentPlayingInstance.audio.seek(mediaTrackSeekPosition);
    return true;
  }

  pausePlayer(): boolean {
    const {mediaPlayer} = store.getState();

    if (!mediaPlayer.mediaPlaybackCurrentPlayingInstance) {
      return false;
    }

    mediaPlayer.mediaPlaybackCurrentPlayingInstance.audio.pause();
    return true;
  }

  resumePlayer(): boolean {
    const {mediaPlayer} = store.getState();

    if (!mediaPlayer.mediaPlaybackCurrentPlayingInstance) {
      return false;
    }

    mediaPlayer.mediaPlaybackCurrentPlayingInstance.audio.play();
    return true;
  }

  stopPlayer(): boolean {
    const {mediaPlayer} = store.getState();

    if (!mediaPlayer.mediaPlaybackCurrentPlayingInstance) {
      return false;
    }

    // important - state for StopPlayer cannot be updated via onstop event handler provided by the audio instance due to race conditions
    // caused when multiple audio instances are started and stopped
    mediaPlayer.mediaPlaybackCurrentPlayingInstance.audio.stop();
    mediaPlayer.mediaPlaybackCurrentPlayingInstance.audio.off();
    store.dispatch({
      type: MediaEnums.MediaPlayerActions.StopPlayer,
    });
    return true;
  }

  changeVolume(mediaPlaybackVolume: number): boolean {
    const {mediaPlayer} = store.getState();

    if (!mediaPlayer.mediaPlaybackCurrentPlayingInstance) {
      return false;
    }

    const mediaPlaybackLocalAudio = this.getVolumeForLocalAudioPlayer(mediaPlaybackVolume);
    mediaPlayer.mediaPlaybackCurrentPlayingInstance.audio.volume(mediaPlaybackLocalAudio);
    return true;
  }

  muteVolume(): boolean {
    const {mediaPlayer} = store.getState();

    if (!mediaPlayer.mediaPlaybackCurrentPlayingInstance) {
      return false;
    }

    mediaPlayer.mediaPlaybackCurrentPlayingInstance.audio.mute(true);
    return true;
  }

  unmuteVolume(): boolean {
    const {mediaPlayer} = store.getState();

    if (!mediaPlayer.mediaPlaybackCurrentPlayingInstance) {
      return false;
    }

    mediaPlayer.mediaPlaybackCurrentPlayingInstance.audio.mute(false);
    return true;
  }

  private playLocalAudio(mediaPlaybackFilePath: string, mediaPlaybackOptions?: HowlOptions): Howl {
    // prepare options for howl based on params provided
    const audioOptionsForHowl = _.assign({
      src: mediaPlaybackFilePath,
    }, mediaPlaybackOptions);

    // create and return audio instance
    return new Howl(audioOptionsForHowl);
  }

  private getDurationFromAudio(mediaPlaybackLocalAudio: Howl): number {
    // important - howl has documented to report duration in seconds, but we get results via duration() in floating points
    // we are rounding off the seek value to provide consistent results
    return Math.round(mediaPlaybackLocalAudio.duration());
  }

  private getProgressFromAudio(mediaPlaybackLocalAudio: Howl): number {
    // important - howl has documented to report seek in seconds, but we get results via seek() in floating points
    // we are rounding off the seek value to provide consistent results
    return Math.round(mediaPlaybackLocalAudio.seek()) || 0;
  }

  private getVolumeForLocalAudioPlayer(mediaPlaybackSystemVolume: number): number {
    const {mediaPlayer} = store.getState();

    // system volume ranges from 0 to mediaPlaybackVolumeMaxLimit
    // local volume ranges from 0.0 - 1.0
    return mediaPlaybackSystemVolume / mediaPlayer.mediaPlaybackVolumeMaxLimit;
  }

  private getVolumeForSystemAudioPlayer(mediaPlaybackLocalVolume: number): number {
    const {mediaPlayer} = store.getState();

    // system volume ranges from 0 to mediaPlaybackVolumeMaxLimit
    // local volume ranges from 0.0 - 1.0
    return mediaPlaybackLocalVolume * mediaPlayer.mediaPlaybackVolumeMaxLimit;
  }

  private reportMediaPlaybackProgress(): void {
    const self = this;
    const {mediaPlayer} = store.getState();

    if (!mediaPlayer.mediaPlaybackCurrentPlayingInstance) {
      debug('reportMediaPlaybackProgress - no running media instance found, aborting...');
      return;
    }

    const mediaPlaybackExistingProgress = mediaPlayer.mediaPlaybackCurrentMediaProgress || 0;
    const mediaPlaybackProgress = this.getProgressFromAudio(mediaPlayer.mediaPlaybackCurrentPlayingInstance.audio);

    if (mediaPlaybackExistingProgress !== mediaPlaybackProgress) {
      debug('reportMediaPlaybackProgress - reporting progress - existing - %d, new - %d', mediaPlaybackExistingProgress, mediaPlaybackProgress);

      store.dispatch({
        type: MediaEnums.MediaPlayerActions.UpdatePlaybackProgress,
        data: {
          mediaPlaybackProgress,
        },
      });
    }

    if (mediaPlayer.mediaPlaybackCurrentPlayingInstance.audio.playing()) {
      requestAnimationFrame(() => {
        self.reportMediaPlaybackProgress();
      });
    }
  }
}

export default new MediaPlayerLocalService();

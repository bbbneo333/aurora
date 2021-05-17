import * as _ from 'lodash';

// @ts-ignore
import {Howl, HowlOptions} from 'howler';

import {MediaTrack} from '../models';
import {MediaEnums} from '../enums';
import store from '../store';

const debug = require('debug')('app:service:media_player_local_service');

class MediaPlayerLocalService {
  playMediaTrack(mediaTrack: MediaTrack): boolean {
    const self = this;

    // run and store a new audio instance
    const mediaPlaybackLocalAudio = this.playLocalAudio(mediaTrack.location.address, {
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
      onpause: (mediaPlaybackAudioId: number) => {
        debug('playMediaTrack - audio %s - playback id - %d', 'paused', mediaPlaybackAudioId);
        store.dispatch({
          type: MediaEnums.MediaPlayerActions.PausePlayer,
        });
      },
      onstop: (mediaPlaybackAudioId: number) => {
        debug('playMediaTrack - audio %s - playback id - %d', 'stopped', mediaPlaybackAudioId);
      },
      onend: (mediaPlaybackAudioId: number) => {
        debug('playMediaTrack - audio %s - playback id - %d', 'ended', mediaPlaybackAudioId);
      },
      onseek(mediaPlaybackAudioId: number) {
        const mediaPlaybackProgress = self.getProgressFromAudio(this);
        debug('playMediaTrack - audio %s - playback id - %d, progress - %d', 'seeked', mediaPlaybackAudioId, mediaPlaybackProgress);

        requestAnimationFrame(() => {
          self.reportMediaPlaybackProgress();
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

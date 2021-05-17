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
      onplay: (mediaPlaybackAudioId: number) => {
        debug('playMediaTrack - audio %s - playback id - %d', 'played', mediaPlaybackAudioId);
        store.dispatch({
          type: MediaEnums.MediaPlayerActions.Play,
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
        const mediaPlaybackSeek = this.seek();
        debug('playMediaTrack - audio %s - playback id - %d, seek - %d', 'seeked', mediaPlaybackAudioId, mediaPlaybackSeek);
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
    store.dispatch({
      type: MediaEnums.MediaPlayerActions.PausePlayer,
    });

    return true;
  }

  resumePlayer(): boolean {
    const {mediaPlayer} = store.getState();

    if (!mediaPlayer.mediaPlaybackCurrentPlayingInstance) {
      return false;
    }

    mediaPlayer.mediaPlaybackCurrentPlayingInstance.audio.play();
    store.dispatch({
      type: MediaEnums.MediaPlayerActions.Play,
    });

    return true;
  }

  stopPlayer(): boolean {
    const {mediaPlayer} = store.getState();

    if (!mediaPlayer.mediaPlaybackCurrentPlayingInstance) {
      return false;
    }

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

  private reportMediaPlaybackProgress(): void {
    const self = this;
    const {mediaPlayer} = store.getState();

    debug('reportMediaPlaybackProgress - attempting to report progress...');

    if (!mediaPlayer.mediaPlaybackCurrentPlayingInstance) {
      debug('reportMediaPlaybackProgress - no running media instance found, aborting...');
      return;
    }

    const mediaPlaybackProgress = mediaPlayer.mediaPlaybackCurrentPlayingInstance.audio.seek() || 0;
    store.dispatch({
      type: MediaEnums.MediaPlayerActions.UpdatePlaybackProgress,
      data: {
        mediaPlaybackProgress,
      },
    });

    debug('reportMediaPlaybackProgress - reported progress - %d', mediaPlaybackProgress);

    if (mediaPlayer.mediaPlaybackCurrentPlayingInstance.audio.playing()) {
      requestAnimationFrame(() => {
        self.reportMediaPlaybackProgress();
      });
    }
  }
}

export default new MediaPlayerLocalService();

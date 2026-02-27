import { Howl } from 'howler';
import { isEmpty } from 'lodash';

import { IMediaPlayback, IMediaPlaybackOptions } from '../../interfaces';

import { IMediaLocalTrack } from './media-local.interfaces';
import MediaLocalUtils from './media-local.utils';

const debug = require('debug')('aurora:provider:media_local:media_playback');

export class MediaLocalPlayback implements IMediaPlayback {
  private readonly mediaTrack: IMediaLocalTrack;
  private readonly mediaPlaybackLocalAudio: Howl;
  private mediaPlaybackId: number | undefined;
  private mediaPlaybackEnded = false;

  constructor(mediaTrack: IMediaLocalTrack, mediaPlaybackOptions: IMediaPlaybackOptions) {
    if (isEmpty(mediaTrack.extra.file_path)) {
      throw new Error(`MediaLocalPlayback encountered error while loading track - ${mediaTrack.id} - Path must not be empty`);
    }

    this.mediaTrack = mediaTrack;
    this.mediaPlaybackLocalAudio = new Howl({
      src: mediaTrack.extra.file_path,
      volume: MediaLocalPlayback.getVolumeForLocalAudioPlayer(mediaPlaybackOptions.mediaPlaybackVolume, mediaPlaybackOptions.mediaPlaybackMaxVolume),
      mute: mediaPlaybackOptions.mediaPlaybackVolumeMuted,
      // important - in order to support MediaSession, we need to used HTML5 audio
      html5: true,
      // events
      onend: (mediaPlaybackAudioId: number) => {
        debug('audio event %s - playback id - %d', 'end', mediaPlaybackAudioId);
        this.mediaPlaybackEnded = true;
      },
    });
  }

  play(): Promise<boolean> {
    this.mediaPlaybackEnded = false;

    return new Promise((resolve) => {
      this.mediaPlaybackLocalAudio.once('play', (mediaPlaybackAudioId: number) => {
        debug('audio event %s - playback id - %d', 'play', mediaPlaybackAudioId);
        resolve(true);
      });

      // play returns a unique sound ID that can be passed
      // into any method on Howl to control that specific sound
      // important - pass down the stored id if resuming playback
      this.mediaPlaybackId = this.mediaPlaybackLocalAudio.play(this.mediaPlaybackId);
      debug('playing track id - %s, playback id - %d', this.mediaTrack.id, this.mediaPlaybackId);
    });
  }

  checkIfLoading(): boolean {
    return this.mediaPlaybackLocalAudio.state() === 'loading';
  }

  checkIfPlaying(): boolean {
    return this.mediaPlaybackLocalAudio.playing(this.mediaPlaybackId);
  }

  checkIfEnded(): boolean {
    return this.mediaPlaybackEnded;
  }

  getPlaybackProgress(): number {
    return MediaLocalUtils.parseMediaPlaybackDuration(this.mediaPlaybackLocalAudio.seek());
  }

  seekPlayback(mediaPlaybackSeekPosition: number): Promise<boolean> {
    return new Promise((resolve) => {
      this.mediaPlaybackLocalAudio.once('seek', (mediaPlaybackAudioId: number) => {
        // TODO: Hack - When using HTML5 audio, seek is fired even before audio actually starts playing (checkIfPlaying() remains false)
        //  We are reporting a success after a 100 ms delay which during testing always gave positive results (checkIfPlaying() remained true)
        //  Check this unresolved issue - https://github.com/goldfire/howler.js/issues/1235
        setTimeout(() => {
          debug('audio event %s - playback id - %d, playing ? - %s', 'seek', mediaPlaybackAudioId, this.checkIfPlaying());
          resolve(true);
        }, 100);
      });

      debug('seeking track id - %s, playback id - %d, seek position - %d', this.mediaTrack.id, this.mediaPlaybackId, mediaPlaybackSeekPosition);
      this.mediaPlaybackLocalAudio.seek(mediaPlaybackSeekPosition);
    });
  }

  pausePlayback(): Promise<boolean> {
    return new Promise((resolve) => {
      this.mediaPlaybackLocalAudio.once('pause', (mediaPlaybackAudioId: number) => {
        debug('audio event %s - playback id - %d', 'pause', mediaPlaybackAudioId);
        resolve(true);
      });

      debug('pausing track id - %s, playback id - %d', this.mediaTrack.id, this.mediaPlaybackId);
      this.mediaPlaybackLocalAudio.pause();
    });
  }

  resumePlayback(): Promise<boolean> {
    return this.play();
  }

  stopPlayback(): Promise<boolean> {
    return new Promise((resolve) => {
      this.mediaPlaybackLocalAudio.once('stop', (mediaPlaybackAudioId: number) => {
        debug('audio event %s - playback id - %d', 'stop', mediaPlaybackAudioId);
        resolve(true);
      });

      debug('stopping track id - %s, playback id - %d', this.mediaTrack.id, this.mediaPlaybackId);
      this.mediaPlaybackLocalAudio.stop();
    });
  }

  changePlaybackVolume(mediaPlaybackVolume: number, mediaPlaybackMaxVolume: number): Promise<boolean> {
    return new Promise((resolve) => {
      this.mediaPlaybackLocalAudio.once('volume', (mediaPlaybackAudioId: number) => {
        debug('audio event %s - playback id - %d', 'volume', mediaPlaybackAudioId);
        resolve(true);
      });

      debug('changing volume track id - %s, playback id - %d, volume - %d', this.mediaTrack.id, this.mediaPlaybackId, mediaPlaybackVolume);
      this.mediaPlaybackLocalAudio.volume(MediaLocalPlayback.getVolumeForLocalAudioPlayer(mediaPlaybackVolume, mediaPlaybackMaxVolume));
    });
  }

  mutePlaybackVolume(): Promise<boolean> {
    return new Promise((resolve) => {
      this.mediaPlaybackLocalAudio.once('mute', (mediaPlaybackAudioId: number) => {
        debug('audio event %s - playback id - %d', 'mute', mediaPlaybackAudioId);
        resolve(true);
      });

      debug('muting volume track id - %s, playback id - %d', this.mediaTrack.id, this.mediaPlaybackId);
      this.mediaPlaybackLocalAudio.mute(true);
    });
  }

  unmutePlaybackVolume(): Promise<boolean> {
    return new Promise((resolve) => {
      this.mediaPlaybackLocalAudio.once('mute', (mediaPlaybackAudioId: number) => {
        debug('audio event %s - playback id - %d', 'mute', mediaPlaybackAudioId);
        resolve(true);
      });

      debug('un-muting volume track id - %s, playback id - %d', this.mediaTrack.id, this.mediaPlaybackId);
      this.mediaPlaybackLocalAudio.mute(false);
    });
  }

  private static getVolumeForLocalAudioPlayer(mediaPlaybackVolume: number, mediaPlaybackMaxVolume: number): number {
    // system volume ranges from 0 to mediaPlaybackVolumeMaxLimit
    // local volume ranges from 0.0 - 1.0
    return mediaPlaybackVolume / mediaPlaybackMaxVolume;
  }
}

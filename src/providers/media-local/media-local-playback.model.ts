// @ts-ignore
import {Howl} from 'howler';

import Promise from 'bluebird';

import {IMediaPlayback, IMediaPlaybackOptions} from '../../interfaces';
import {MediaLocalTrack} from './media-local-track.model';

const debug = require('debug')('app:provider:media_local:media_playback');

export class MediaLocalPlayback implements IMediaPlayback {
  private readonly mediaTrack: MediaLocalTrack;
  private readonly mediaPlaybackLocalAudio: any;
  private mediaPlaybackId: number | undefined;

  constructor(mediaTrack: MediaLocalTrack, mediaPlaybackOptions: IMediaPlaybackOptions) {
    this.mediaTrack = mediaTrack;
    this.mediaPlaybackLocalAudio = new Howl({
      src: mediaTrack.location.address,
      volume: MediaLocalPlayback.getVolumeForLocalAudioPlayer(mediaPlaybackOptions.mediaPlaybackVolume, mediaPlaybackOptions.mediaPlaybackMaxVolume),
    });
  }

  play(): Promise<boolean> {
    return new Promise((resolve) => {
      this.mediaPlaybackLocalAudio.once('play', (mediaPlaybackAudioId: number) => {
        debug('audio event %s - playback id - %d', 'play', mediaPlaybackAudioId);
        resolve(true);
      });

      // play returns a unique sound ID that can be passed
      // into any method on Howl to control that specific sound
      this.mediaPlaybackId = this.mediaPlaybackLocalAudio.play();
      debug('playing track id - %s, playback id - %d', this.mediaTrack.id, this.mediaPlaybackId);
    });
  }

  checkIfPlaying(): boolean {
    return this.mediaPlaybackLocalAudio.playing();
  }

  getPlaybackProgress(): number {
    // important - howl has documented to report seek in seconds, but we get results via seek() in floating points
    // we are rounding off the seek value to provide consistent results
    return Math.round(this.mediaPlaybackLocalAudio.seek()) || 0;
  }

  seekPlayback(mediaPlaybackSeekPosition: number): Promise<boolean> {
    return new Promise((resolve) => {
      this.mediaPlaybackLocalAudio.once('seek', (mediaPlaybackAudioId: number) => {
        debug('audio event %s - playback id - %d', 'seek', mediaPlaybackAudioId);
        resolve(true);
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

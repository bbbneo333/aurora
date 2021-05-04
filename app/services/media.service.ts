import {parseFile, IAudioMetadata} from 'music-metadata';
import * as _ from 'lodash';

// @ts-ignore
import {Howl, HowlOptions} from 'howler';

export class MediaService {
  /**
   * Reads audio metadata from audio file located at the path
   *
   * @function readAudioMetadataFromFile
   * @param {String} filePath
   * @returns {Promise<IAudioMetadata>}
   */
  readAudioMetadataFromFile(filePath: string): Promise<IAudioMetadata> {
    return parseFile(filePath);
  }

  /**
   * Plays audio from local media file
   *
   * @function playLocalAudio
   * @param {String} mediaPlaybackFilePath
   * @param {HowlOptions} [mediaPlaybackOptions]
   * @returns {{audio: Howl, audio_playback_id: number}}
   */
  playLocalAudio(mediaPlaybackFilePath: string, mediaPlaybackOptions?: HowlOptions): {
    audio: Howl,
    audio_playback_id: number,
  } {
    // prepare options for howl based on params provided
    const audioOptionsForHowl = _.assign({
      src: mediaPlaybackFilePath,
    }, mediaPlaybackOptions);

    // create audio instance
    const audio = new Howl(audioOptionsForHowl);

    // play returns a unique sound ID that can be passed
    // into any method on Howl to control that specific sound
    const audioPlaybackId = audio.play();

    return {
      audio,
      audio_playback_id: audioPlaybackId,
    };
  }
}

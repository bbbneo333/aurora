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
   * @returns {Howl}
   */
  playLocalAudio(mediaPlaybackFilePath: string, mediaPlaybackOptions?: HowlOptions): Howl {
    // prepare options for howl based on params provided
    const audioOptionsForHowl = _.assign({
      src: mediaPlaybackFilePath,
    }, mediaPlaybackOptions);

    // create and return audio instance
    return new Howl(audioOptionsForHowl);
  }
}

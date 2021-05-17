import * as _ from 'lodash';

// @ts-ignore
import {Howl, HowlOptions} from 'howler';

class MediaService {
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

export default new MediaService();

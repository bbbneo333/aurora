import {parseFile, IAudioMetadata} from 'music-metadata';

/**
 * Reads audio metadata from audio file located at the path
 *
 * @function readAudioMetadataFromFile
 * @param {String} filePath
 * @returns {Promise}
 */
async function readAudioMetadataFromFile(filePath: string): Promise<IAudioMetadata> {
  return parseFile(filePath);
}

export const MediaMetadataUtils = {
  readAudioMetadataFromFile,
};

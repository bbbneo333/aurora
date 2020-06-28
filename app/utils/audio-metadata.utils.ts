import {parseFile, IAudioMetadata} from 'music-metadata';

/**
 * Reads audio metadata from audio file located at the path
 *
 * @function readMetadataFromFile
 * @param {String} filePath
 * @returns {Promise}
 */
async function readMetadataFromFile(filePath: string): Promise<IAudioMetadata> {
  return parseFile(filePath);
}

export const AudioMetadataUtils = {
  readMetadataFromFile
};

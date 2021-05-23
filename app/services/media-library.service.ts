import * as _ from 'lodash';
import {v4 as uuidv4} from 'uuid';
import {
  IAudioMetadata,
  IPicture,
  parseFile,
  selectCover,
} from 'music-metadata';

import {MediaEnums, SystemEnums} from '../enums';
import {MediaTrack} from '../models';
import SystemService, {FSDirReadFileEventData, FSDirReadStats} from './system.service';
import store from '../store';

const debug = require('debug')('app:service:media_library_service');

class MediaLibraryService {
  readonly mediaTrackSupportedFileTypes = [
    MediaEnums.MediaFileExtensions.MP3,
    MediaEnums.MediaFileExtensions.FLAC,
    MediaEnums.MediaFileExtensions.M4A,
    MediaEnums.MediaFileExtensions.WAV,
  ];

  addDirectoryToLibrary(): void {
    const selectedDirectories = SystemService.openSelectionDialog({
      selectionModes: [SystemEnums.DialogOpenModes.Directory],
    });
    if (!selectedDirectories || _.isEmpty(selectedDirectories)) {
      return;
    }

    // openSelectionDialog responds back with a list of directories
    // we will be only processing the initial selection
    const selectedDirectory = selectedDirectories[0];
    const readDirectoryEmitter = SystemService.readDirectory(selectedDirectory, {
      fileExtensions: this.mediaTrackSupportedFileTypes,
    });

    readDirectoryEmitter.on('error', (error) => {
      debug('addTracksFromDirectory - encountered error');
      debug(error);
    });

    readDirectoryEmitter.on('file', async (fsDirReadFileEventData: FSDirReadFileEventData, fsDirReadNext) => {
      debug('addTracksFromDirectory - found file - %s', fsDirReadFileEventData.path);
      // read metadata
      const audioMetadata = await this.readAudioMetadataFromFile(fsDirReadFileEventData.path);
      // obtain cover image (important - there can be cases where audio has no cover image, handle accordingly)
      const audioCoverPicture = this.getAudioCoverPictureFromMetadata(audioMetadata);
      // update store
      store.dispatch({
        type: MediaEnums.MediaLibraryActions.AddTrack,
        data: {
          mediaTrack: new MediaTrack({
            id: uuidv4(),
            track_name: audioMetadata.common.title || 'unknown track',
            track_artists: audioMetadata.common.artists || ['unknown artist'],
            track_album_name: audioMetadata.common.album || 'unknown album',
            track_duration: audioMetadata.format.duration || 1000,
            track_cover_picture: audioCoverPicture ? {
              image_data: audioCoverPicture.data,
              image_data_type: MediaEnums.MediaTrackCoverPictureImageDataType.Buffer,
              image_format: audioCoverPicture.format,
            } : undefined,
            location: {
              address: fsDirReadFileEventData.path,
              type: MediaEnums.MediaTrackLocationType.LocalFileSystem,
            },
          }),
        },
      });
      // proceed to next
      fsDirReadNext();
    });

    readDirectoryEmitter.on('finished', (fsDirReadStats: FSDirReadStats) => {
      debug('addTracksFromDirectory - finished processing - %o', fsDirReadStats);
    });
  }

  removeMediaTrackFromLibrary(mediaTrack: MediaTrack): void {
    store.dispatch({
      type: MediaEnums.MediaLibraryActions.RemoveTrack,
      data: {
        mediaTrackId: mediaTrack.id,
      },
    });
  }

  private readAudioMetadataFromFile(filePath: string): Promise<IAudioMetadata> {
    return parseFile(filePath);
  }

  private getAudioCoverPictureFromMetadata(audioMetadata: IAudioMetadata): IPicture | null {
    return selectCover(audioMetadata.common.picture);
  }
}

export default new MediaLibraryService();

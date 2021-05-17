import * as _ from 'lodash';
import {v4 as uuidv4} from 'uuid';
import {IAudioMetadata, parseFile} from 'music-metadata';

import {MediaEnums, SystemEnums} from '../enums';
import {MediaTrack} from '../models';
import SystemService, {FSDirReadFileEventData, FSDirReadStats} from './system.service';
import store from '../store';

const debug = require('debug')('app:service:media_library_service');

class MediaLibraryService {
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
      fileExtensions: [
        MediaEnums.MediaFileExtensions.MP3,
        MediaEnums.MediaFileExtensions.FLAC,
        MediaEnums.MediaFileExtensions.M4A,
        MediaEnums.MediaFileExtensions.WAV,
      ],
    });

    readDirectoryEmitter.on('error', (error) => {
      debug('addTracksFromDirectory - encountered error');
      debug(error);
    });

    readDirectoryEmitter.on('file', async (fsDirReadFileEventData: FSDirReadFileEventData, fsDirReadNext) => {
      debug('addTracksFromDirectory - found file - %s', fsDirReadFileEventData.path);
      // read metadata
      const audioMetadata = await this.readAudioMetadataFromFile(fsDirReadFileEventData.path);
      // update store
      store.dispatch({
        type: MediaEnums.MediaLibraryActions.AddTrack,
        data: {
          mediaTrack: new MediaTrack({
            id: uuidv4(),
            track_name: audioMetadata.common.title || 'unknown track',
            track_album_name: audioMetadata.common.album || 'unknown album',
            track_duration: audioMetadata.format.duration || 1000,
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
      debug('addTracksFromDirectory - finished processing');
      debug(fsDirReadStats);
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
}

export default new MediaLibraryService();

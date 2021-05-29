import {TypedEmitter} from 'tiny-typed-emitter';
import * as _ from 'lodash';
import {v4 as uuidv4} from 'uuid';
import {
  IAudioMetadata,
  IPicture,
  parseFile,
  selectCover,
} from 'music-metadata';

import {IMediaLibraryEvents, IMediaLibraryService} from '../../interfaces';
import {MediaEnums, SystemEnums} from '../../enums';
import SystemService, {FSDirReadFileEventData, FSDirReadStats} from '../../services/system.service';

import {MediaLocalTrack} from './media-local-track.model';

const debug = require('debug')('app:provider:media_local:media_library');

export class MediaLocalLibraryService extends TypedEmitter<IMediaLibraryEvents> implements IMediaLibraryService {
  readonly mediaTrackSupportedFileTypes = [
    MediaEnums.MediaFileExtensions.MP3,
    MediaEnums.MediaFileExtensions.FLAC,
    MediaEnums.MediaFileExtensions.M4A,
    MediaEnums.MediaFileExtensions.WAV,
  ];

  addMediaTracks(): void {
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
      const audioMetadata = await MediaLocalLibraryService.readAudioMetadataFromFile(fsDirReadFileEventData.path);
      // obtain cover image (important - there can be cases where audio has no cover image, handle accordingly)
      const audioCoverPicture = MediaLocalLibraryService.getAudioCoverPictureFromMetadata(audioMetadata);
      // prepare media track
      const mediaTrack = new MediaLocalTrack({
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
        },
      });
      // emit event
      this.emit(MediaEnums.MediaLibraryUpdateEvent.AddedTrack, mediaTrack);
      // proceed to next
      fsDirReadNext();
    });

    readDirectoryEmitter.on('finished', (fsDirReadStats: FSDirReadStats) => {
      debug('addTracksFromDirectory - finished processing - %o', fsDirReadStats);
    });
  }

  removeMediaTrack(): boolean {
    // we don't need any special implementation for removing media item
    // simply acknowledge
    return true;
  }

  private static readAudioMetadataFromFile(filePath: string): Promise<IAudioMetadata> {
    return parseFile(filePath);
  }

  private static getAudioCoverPictureFromMetadata(audioMetadata: IAudioMetadata): IPicture | null {
    return selectCover(audioMetadata.common.picture);
  }
}

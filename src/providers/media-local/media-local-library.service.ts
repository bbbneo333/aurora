import {TypedEmitter} from 'tiny-typed-emitter';
import {v4 as uuidv4} from 'uuid';

import {
  IAudioMetadata,
  IPicture,
  parseFile,
  selectCover,
} from 'music-metadata';

import {IMediaLibraryEvents, IMediaLibraryService} from '../../interfaces';
import {AppEnums, MediaEnums} from '../../enums';
import {AppService} from '../../services';
import {FSDirectorySelectionResponse} from '../../types';

import {MediaLocalTrack} from './media-local-track.model';
import MediaLocalUtils from './media-local.utils';

const debug = require('debug')('app:provider:media_local:media_library');

export class MediaLocalLibraryService extends TypedEmitter<IMediaLibraryEvents> implements IMediaLibraryService {
  readonly mediaTrackSupportedFileTypes = [
    MediaEnums.MediaFileExtensions.MP3,
    MediaEnums.MediaFileExtensions.FLAC,
    MediaEnums.MediaFileExtensions.M4A,
    MediaEnums.MediaFileExtensions.WAV,
  ];

  addMediaTracks(): void {
    AppService
      .sendAsyncMessage(AppEnums.IPCCommChannels.FSSelectDirectory, {
        readFileExtensions: this.mediaTrackSupportedFileTypes,
      })
      .then(async (fsDirectorySelectionResponse: FSDirectorySelectionResponse) => {
        if (!fsDirectorySelectionResponse) {
          // user either cancelled the selection or no selected directories could be obtained, abort
          return;
        }

        await Promise.all(fsDirectorySelectionResponse.directory_read.files.map(async (fsDirectoryReadFile) => {
          debug('addTracksFromDirectory - found file - %s', fsDirectoryReadFile.path);
          // read metadata
          const audioMetadata = await MediaLocalLibraryService.readAudioMetadataFromFile(fsDirectoryReadFile.path);
          // obtain cover image (important - there can be cases where audio has no cover image, handle accordingly)
          const audioCoverPicture = MediaLocalLibraryService.getAudioCoverPictureFromMetadata(audioMetadata);
          // prepare media track
          const mediaTrack = new MediaLocalTrack({
            id: uuidv4(),
            track_name: audioMetadata.common.title || 'unknown track',
            track_artists: audioMetadata.common.artists || ['unknown artist'],
            track_album_name: audioMetadata.common.album || 'unknown album',
            track_duration: MediaLocalUtils.parseMediaMetadataDuration(audioMetadata.format.duration),
            track_cover_picture: audioCoverPicture ? {
              image_data: audioCoverPicture.data,
              image_data_type: MediaEnums.MediaTrackCoverPictureImageDataType.Buffer,
              image_format: audioCoverPicture.format,
            } : undefined,
            location: {
              address: fsDirectoryReadFile.path,
            },
          });
          // emit event
          this.emit(MediaEnums.MediaLibraryUpdateEvent.AddedTrack, mediaTrack);
        }));

        debug('addTracksFromDirectory - finished processing - %o', fsDirectorySelectionResponse.directory_read.stats);
      })
      .catch((error) => {
        debug('addTracksFromDirectory - encountered error');
        debug(error);
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

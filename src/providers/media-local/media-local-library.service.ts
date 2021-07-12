import {
  IAudioMetadata,
  IPicture,
  parseFile,
  selectCover,
} from 'music-metadata';

import {AppEnums, MediaEnums} from '../../enums';
import {IFSDirectoryReadResponse, IMediaLibraryService} from '../../interfaces';
import {AppService, MediaProviderService, MediaLibraryService} from '../../services';

import {IMediaLocalSettings} from './media-local.interfaces';
import MediaLocalConstants from './media-local.constants.json';
import MediaLocalUtils from './media-local.utils';

const debug = require('debug')('app:provider:media_local:media_library');

class MediaLocalLibraryService implements IMediaLibraryService {
  private readonly mediaTrackSupportedFileTypes = [
    MediaEnums.MediaFileExtensions.MP3,
    MediaEnums.MediaFileExtensions.FLAC,
    MediaEnums.MediaFileExtensions.M4A,
    MediaEnums.MediaFileExtensions.WAV,
  ];

  onProviderRegistered(): void {
    debug('onProviderRegistered - received');
    this.syncMediaTracks()
      .then(() => {
        debug('onProviderRegistered - sync completed');
      });
  }

  onProviderSettingsUpdated(existingSettings: object, updatedSettings: object): void {
    debug('onProviderSettingsUpdated - received - existing settings - %o, updated settings - %o', existingSettings, updatedSettings);
    this.syncMediaTracks()
      .then(() => {
        debug('onProviderSettingsUpdated - sync completed');
      });
  }

  async syncMediaTracks() {
    const mediaProviderSettings: IMediaLocalSettings = await MediaProviderService.getMediaProviderSettings(MediaLocalConstants.Provider);
    const mediaSyncKey = await MediaLibraryService.startMediaTrackSync(MediaLocalConstants.Provider);
    await Promise.mapSeries(mediaProviderSettings.library.directories, mediaLibraryDirectory => this.addTracksFromDirectory(mediaLibraryDirectory, mediaSyncKey));
    await MediaLibraryService.finishMediaTrackSync(MediaLocalConstants.Provider, mediaSyncKey);
  }

  private async addTracksFromDirectory(mediaLibraryDirectory: string, mediaSyncKey: string): Promise<void> {
    const fsDirectoryReadResponse: IFSDirectoryReadResponse = await AppService.sendAsyncMessage(AppEnums.IPCCommChannels.FSReadDirectory, mediaLibraryDirectory, {
      fileExtensions: this.mediaTrackSupportedFileTypes,
    });

    await Promise.mapSeries(fsDirectoryReadResponse.files, async (fsDirectoryReadFile) => {
      debug('addTracksFromDirectory - found file - %s', fsDirectoryReadFile.path);
      // read metadata
      const audioMetadata = await MediaLocalLibraryService.readAudioMetadataFromFile(fsDirectoryReadFile.path);
      // obtain cover image (important - there can be cases where audio has no cover image, handle accordingly)
      const audioCoverPicture = MediaLocalLibraryService.getAudioCoverPictureFromMetadata(audioMetadata);
      // generate local id - we are using location of the file to uniquely identify the track
      const mediaTrackId = MediaLocalLibraryService.getMediaTrackId(fsDirectoryReadFile.path);
      // add media track
      await MediaLibraryService.insertMediaTrack(MediaLocalConstants.Provider, {
        provider_id: mediaTrackId,
        track_name: audioMetadata.common.title || 'unknown track',
        track_number: audioMetadata.common.track.no || 0,
        track_artists: audioMetadata.common.artists ? audioMetadata.common.artists.map(audioArtist => ({
          artist_name: audioArtist,
        })) : [{
          artist_name: 'unknown artist',
        }],
        track_album: {
          album_name: audioMetadata.common.album || 'unknown album',
          album_artist: {
            artist_name: audioMetadata.common.artists ? audioMetadata.common.artists[0] : 'unknown artist',
          },
          album_cover_picture: audioCoverPicture ? {
            image_data: audioCoverPicture.data,
            image_data_type: MediaEnums.MediaTrackCoverPictureImageDataType.Buffer,
            image_format: audioCoverPicture.format,
          } : undefined,
        },
        track_duration: MediaLocalUtils.parseMediaMetadataDuration(audioMetadata.format.duration),
        track_cover_picture: audioCoverPicture ? {
          image_data: audioCoverPicture.data,
          image_data_type: MediaEnums.MediaTrackCoverPictureImageDataType.Buffer,
          image_format: audioCoverPicture.format,
        } : undefined,
        sync: {
          sync_key: mediaSyncKey,
        },
        extra: {
          location: {
            address: fsDirectoryReadFile.path,
          },
        },
      });
    });
    debug('addTracksFromDirectory - finished processing - %o', fsDirectoryReadResponse.stats);
  }

  private static getMediaTrackId(mediaTrackInput: string): string {
    return AppService.sendSyncMessage(AppEnums.IPCCommChannels.CryptoGenerateSHA256Hash, mediaTrackInput);
  }

  private static readAudioMetadataFromFile(filePath: string): Promise<IAudioMetadata> {
    return parseFile(filePath);
  }

  private static getAudioCoverPictureFromMetadata(audioMetadata: IAudioMetadata): IPicture | null {
    return selectCover(audioMetadata.common.picture);
  }
}

export default new MediaLocalLibraryService();

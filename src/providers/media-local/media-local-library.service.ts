import {
  IAudioMetadata,
  IPicture,
  parseFile,
  selectCover,
} from 'music-metadata';

import { AppEnums, AudioFileExtensionList, MediaEnums } from '../../enums';
import { IFSDirectoryReadResponse, IMediaLibraryService } from '../../interfaces';
import { AppService, MediaProviderService, MediaLibraryService } from '../../services';

import { IMediaLocalSettings } from './media-local.interfaces';
import MediaLocalConstants from './media-local.constants.json';
import MediaLocalUtils from './media-local.utils';

const debug = require('debug')('app:provider:media_local:media_library');

class MediaLocalLibraryService implements IMediaLibraryService {
  onProviderRegistered(): void {
    debug('onProviderRegistered - received');
    debug('onProviderRegistered - starting sync');
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
    await MediaLibraryService.syncMedia(MediaLocalConstants.Provider, async () => {
      const mediaProviderSettings: IMediaLocalSettings = await MediaProviderService.getMediaProviderSettings(MediaLocalConstants.Provider);
      await Promise.mapSeries(mediaProviderSettings.library.directories, mediaLibraryDirectory => this.addTracksFromDirectory(mediaLibraryDirectory));
    });
  }

  private async addTracksFromDirectory(mediaLibraryDirectory: string): Promise<void> {
    const fsDirectoryReadResponse: IFSDirectoryReadResponse | undefined = await AppService
      .sendAsyncMessage(AppEnums.IPCCommChannels.FSReadDirectory, mediaLibraryDirectory, {
        fileExtensions: AudioFileExtensionList,
      }).catch((error) => {
        // handle in case existing directory could not be found now
        if (error.code === 'ENOENT') {
          return;
        }
        throw error;
      });

    if (!fsDirectoryReadResponse) {
      debug('addTracksFromDirectory - no contents received, skipping directory - %s', mediaLibraryDirectory);
      return;
    }

    await Promise.mapSeries(fsDirectoryReadResponse.files, async (fsDirectoryReadFile) => {
      debug('addTracksFromDirectory - found file - %s', fsDirectoryReadFile.path);
      const mediaSyncTimestamp = Date.now();

      // read metadata
      const audioMetadata = await MediaLocalLibraryService.readAudioMetadataFromFile(fsDirectoryReadFile.path);
      // obtain cover image (important - there can be cases where audio has no cover image, handle accordingly)
      const audioCoverPicture = MediaLocalLibraryService.getAudioCoverPictureFromMetadata(audioMetadata);
      // generate local id - we are using location of the file to uniquely identify the track
      const mediaTrackId = MediaLocalLibraryService.getMediaId(fsDirectoryReadFile.path);
      // add media artist
      const mediaArtistDataList = await MediaLibraryService.checkAndInsertMediaArtists(audioMetadata.common.artists
        ? audioMetadata.common.artists.map(audioArtist => ({
          artist_name: audioArtist,
          provider: MediaLocalConstants.Provider,
          provider_id: MediaLocalLibraryService.getMediaId(audioArtist),
          sync_timestamp: mediaSyncTimestamp,
        }))
        : [{
          artist_name: 'unknown artist',
          provider: MediaLocalConstants.Provider,
          provider_id: MediaLocalLibraryService.getMediaId('unknown artist'),
          sync_timestamp: mediaSyncTimestamp,
        }]);
      // add media album
      const mediaAlbumName = audioMetadata.common.album || 'unknown album';
      const mediaAlbumData = await MediaLibraryService.checkAndInsertMediaAlbum({
        album_name: mediaAlbumName,
        album_artist_id: mediaArtistDataList[0].id,
        album_cover_picture: audioCoverPicture ? {
          image_data: audioCoverPicture.data,
          image_data_type: MediaEnums.MediaTrackCoverPictureImageDataType.Buffer,
        } : undefined,
        provider: MediaLocalConstants.Provider,
        provider_id: MediaLocalLibraryService.getMediaId(mediaAlbumName),
        sync_timestamp: mediaSyncTimestamp,
      });
      // add media track
      await MediaLibraryService.checkAndInsertMediaTrack({
        provider: MediaLocalConstants.Provider,
        provider_id: mediaTrackId,
        // fallback to file name if title could not be found in metadata
        track_name: audioMetadata.common.title || fsDirectoryReadFile.name,
        track_number: audioMetadata.common.track.no || 0,
        track_duration: MediaLocalUtils.parseMediaMetadataDuration(audioMetadata.format.duration),
        track_cover_picture: audioCoverPicture ? {
          image_data: audioCoverPicture.data,
          image_data_type: MediaEnums.MediaTrackCoverPictureImageDataType.Buffer,
        } : undefined,
        track_artist_ids: mediaArtistDataList.map(mediaArtistData => mediaArtistData.id),
        track_album_id: mediaAlbumData.id,
        extra: {
          location: {
            address: fsDirectoryReadFile.path,
          },
        },
        sync_timestamp: mediaSyncTimestamp,
      });
    });
    debug('addTracksFromDirectory - finished processing - %o', fsDirectoryReadResponse.stats);
  }

  private static getMediaId(mediaInput: string): string {
    return AppService.sendSyncMessage(AppEnums.IPCCommChannels.CryptoGenerateSHA256Hash, mediaInput);
  }

  private static readAudioMetadataFromFile(filePath: string): Promise<IAudioMetadata> {
    return parseFile(filePath);
  }

  private static getAudioCoverPictureFromMetadata(audioMetadata: IAudioMetadata): IPicture | null {
    return selectCover(audioMetadata.common.picture);
  }
}

export default new MediaLocalLibraryService();

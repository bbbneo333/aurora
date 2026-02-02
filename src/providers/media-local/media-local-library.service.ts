import {
  IAudioMetadata,
  IPicture,
  parseFile,
  selectCover,
} from 'music-metadata';

import { Semaphore } from 'async-mutex';

import { AudioFileExtensionList, MediaEnums } from '../../enums';
import { IFSDirectoryReadResponse, IMediaLibraryService } from '../../interfaces';
import { MediaProviderService, MediaLibraryService } from '../../services';
import { IPCRenderer, IPCCommChannel } from '../../modules/ipc';
import { CryptoService } from '../../modules/crypto';

import { IMediaLocalSettings } from './media-local.interfaces';
import MediaLocalConstants from './media-local.constants.json';
import MediaLocalUtils from './media-local.utils';
import { MediaLocalStateActionType, mediaLocalStore } from './media-local.store';

const debug = require('debug')('app:provider:media_local:media_library');

class MediaLocalLibraryService implements IMediaLibraryService {
  private readonly mediaSyncLock = new Semaphore(1);

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
    // use mediaSyncLock to only run one sync at a time
    await this.mediaSyncLock.runExclusive(async () => {
      mediaLocalStore.dispatch({
        type: MediaLocalStateActionType.StartSync,
      });
      await MediaLibraryService.startMediaTrackSync(MediaLocalConstants.Provider);

      const mediaProviderSettings: IMediaLocalSettings = await MediaProviderService.getMediaProviderSettings(MediaLocalConstants.Provider);
      await Promise.mapSeries(mediaProviderSettings.library.directories, mediaLibraryDirectory => this.addTracksFromDirectory(mediaLibraryDirectory));

      await MediaLibraryService.finishMediaTrackSync(MediaLocalConstants.Provider);
      mediaLocalStore.dispatch({
        type: MediaLocalStateActionType.FinishSync,
      });
    });
  }

  private async addTracksFromDirectory(mediaLibraryDirectory: string): Promise<void> {
    const fsDirectoryReadResponse: IFSDirectoryReadResponse | undefined = await IPCRenderer
      .sendAsyncMessage(IPCCommChannel.FSReadDirectory, mediaLibraryDirectory, {
        fileExtensions: AudioFileExtensionList,
      }).catch((error) => {
        // just log on error, continue the sync process
        console.error(error);
      });

    if (!fsDirectoryReadResponse) {
      debug('addTracksFromDirectory - no valid contents received, skipping directory - %s', mediaLibraryDirectory);
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
    return CryptoService.sha256(mediaInput);
  }

  private static readAudioMetadataFromFile(filePath: string): Promise<IAudioMetadata> {
    return parseFile(filePath);
  }

  private static getAudioCoverPictureFromMetadata(audioMetadata: IAudioMetadata): IPicture | null {
    return selectCover(audioMetadata.common.picture);
  }
}

export default new MediaLocalLibraryService();

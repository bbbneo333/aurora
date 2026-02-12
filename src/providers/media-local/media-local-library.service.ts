import {
  IAudioMetadata,
  IPicture,
  parseFile,
  selectCover,
} from 'music-metadata';

import PQueue from 'p-queue';

import { AudioFileExtensionList, MediaEnums } from '../../enums';
import { IMediaLibraryService } from '../../interfaces';
import { MediaLibraryService, MediaProviderService } from '../../services';
import { SingleFlight } from '../../types';
import { DateTimeUtils } from '../../utils';

import { CryptoService } from '../../modules/crypto';
import { FSFile } from '../../modules/file-system';
import { IPCCommChannel, IPCRenderer } from '../../modules/ipc';

import { IMediaLocalSettings } from './media-local.interfaces';
import MediaLocalConstants from './media-local.constants.json';
import MediaLocalUtils from './media-local.utils';
import { MediaLocalStateActionType, mediaLocalStore } from './media-local.store';

const debug = require('debug')('aurora:provider:media_local:media_library');

class MediaLocalLibraryService implements IMediaLibraryService {
  private readonly syncAddFileQueue = new PQueue({ concurrency: 100, autoStart: true, timeout: 5 * 60 * 1000 }); // timeout of 5 minutes
  private readonly syncRunner = new SingleFlight();

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
    return this.syncRunner.run(async (signal: AbortSignal) => {
      debug('syncMediaTracks - started sync');

      const syncStart = performance.now();
      let syncFileCount = 0;

      // finalize
      const finalize = (() => {
        const onCompleted = () => {
          syncFileCount += 1;
        };
        const onAbort = () => this.syncAddFileQueue.clear();

        this.syncAddFileQueue.on('completed', onCompleted);
        signal.addEventListener('abort', onAbort);

        return () => {
          this.syncAddFileQueue.off('completed', onCompleted);
          signal.removeEventListener('abort', onAbort);
        };
      })();

      try {
        // start
        mediaLocalStore.dispatch({ type: MediaLocalStateActionType.StartSync });
        await MediaLibraryService.startMediaTrackSync(MediaLocalConstants.Provider);
        const settings: IMediaLocalSettings = await MediaProviderService.getMediaProviderSettings(MediaLocalConstants.Provider);
        await Promise.map(settings.library.directories, directory => this.addTracksFromDirectory(directory, signal));

        // wait
        await this.syncAddFileQueue.onIdle();

        // done
        await MediaLibraryService.finishMediaTrackSync(MediaLocalConstants.Provider);
        const syncDuration = performance.now() - syncStart;
        mediaLocalStore.dispatch({
          type: MediaLocalStateActionType.FinishSync,
          data: {
            syncDuration,
            syncFileCount,
          },
        });

        debug(
          'syncMediaTracks - finished sync, took - %s, files added - %d',
          DateTimeUtils.formatDuration(syncDuration),
          syncFileCount,
        );
      } finally {
        finalize();
      }
    });
  }

  private addTracksFromDirectory(mediaLibraryDirectory: string, signal: AbortSignal): Promise<void> {
    return new Promise((resolve) => {
      debug('addTracksFromDirectory - adding tracks from directory - %s', mediaLibraryDirectory);

      IPCRenderer.stream(
        IPCCommChannel.FSReadDirectoryStream, {
          directory: mediaLibraryDirectory,
          fileExtensions: AudioFileExtensionList,
        }, (data: { files: FSFile[] }) => {
          // on data
          this.addTracksFromFiles(data.files, signal);
        }, (err: Error) => {
          // on error
          // don't stop, just log
          console.error('Encountered error while reading files from path - %s', mediaLibraryDirectory);
          console.error(err);
        }, () => {
          // on done
          debug('addTracksFromDirectory - finished adding tracks from directory - %s', mediaLibraryDirectory);
          resolve();
        },
        signal,
      );
    });
  }

  private addTracksFromFiles(files: FSFile[], signal: AbortSignal) {
    files.forEach((file) => {
      debug('addTracksFromDirectory - found file at - %s, queueing...', file.path);

      this.syncAddFileQueue
        .add(async () => {
          if (signal.aborted) {
            debug('addTracksFromDirectory - operation aborted, skipping - %s', file.name);
            return;
          }

          const track = await this.addTrackFromFile(file);
          debug('addTracksFromDirectory - added track from file - %s - %s', file.name, track.id);
        })
        .catch((err) => {
          console.error('addTracksFromDirectory - encountered error while adding file - %s', file.name);
          console.error(err);
        });
    });
  }

  private async addTrackFromFile(file: FSFile) {
    const mediaSyncTimestamp = Date.now();
    // read metadata
    const audioMetadata = await MediaLocalLibraryService.readAudioMetadataFromFile(file.path);
    // obtain cover image (important - there can be cases where audio has no cover image, handle accordingly)
    const audioCoverPicture = MediaLocalLibraryService.getAudioCoverPictureFromMetadata(audioMetadata);
    // generate local id - we are using location of the file to uniquely identify the track
    const mediaTrackId = MediaLocalLibraryService.getMediaId(file.path);
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
    return MediaLibraryService.checkAndInsertMediaTrack({
      provider: MediaLocalConstants.Provider,
      provider_id: mediaTrackId,
      // fallback to file name if title could not be found in metadata
      track_name: audioMetadata.common.title || file.name,
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
          address: file.path,
        },
      },
      sync_timestamp: mediaSyncTimestamp,
    });
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

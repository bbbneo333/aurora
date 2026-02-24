import {
  IAudioMetadata,
  IPicture,
  parseFile,
  selectCover,
} from 'music-metadata';

import PQueue from 'p-queue';
import { Semaphore } from 'async-mutex';
import { isNumber } from 'lodash';

import { MediaEnums } from '../../enums';
import { IMediaLibraryService } from '../../interfaces';
import { DateTimeUtils } from '../../utils';

import {
  MediaAlbumService,
  MediaArtistService,
  MediaLibraryService,
  MediaProviderService,
  MediaTrackService,
} from '../../services';

import { CryptoService } from '../../modules/crypto';
import { FSFile, FSAudioExtensions } from '../../modules/file-system';
import { IPCCommChannel, IPCRenderer } from '../../modules/ipc';

import { IMediaLocalSettings } from './media-local.interfaces';
import MediaLocalConstants from './media-local.constants.json';
import MediaLocalUtils from './media-local.utils';
import { MediaLocalStateActionType, mediaLocalStore } from './media-local.store';

const debug = require('debug')('aurora:provider:media_local:media_library');

class MediaLocalLibraryService implements IMediaLibraryService {
  private readonly syncAddFileQueue = new PQueue({ concurrency: 10, autoStart: true, timeout: 5 * 60 * 1000 }); // timeout 5 minutes / track
  private readonly syncLock = new Semaphore(1);
  private syncAbortController: AbortController | null = null;

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
    // cancel currently running sync
    if (this.syncAbortController) {
      this.syncAbortController.abort();
    }

    const abortController = new AbortController();
    this.syncAbortController = abortController;

    return this.syncLock.runExclusive(async () => {
      // if we were replaced before acquiring lock, bail
      if (this.syncAbortController !== abortController) {
        return;
      }

      debug('syncMediaTracks - started sync');

      const syncStart = performance.now();
      const { signal } = abortController;

      // finalize
      const finalize = (() => {
        const onAbort = () => this.syncAddFileQueue.clear();

        signal.addEventListener('abort', onAbort);

        return () => {
          if (this.syncAbortController === abortController) {
            this.syncAbortController = null;
          }

          signal.removeEventListener('abort', onAbort);
        };
      })();

      try {
        // start
        mediaLocalStore.dispatch({ type: MediaLocalStateActionType.StartSync });
        await MediaLibraryService.startMediaTrackSync(MediaLocalConstants.Provider);
        const settings: IMediaLocalSettings = await MediaProviderService.getMediaProviderSettings(MediaLocalConstants.Provider);
        await Promise.map(settings.library.directories, directory => this.addTracksFromDirectory(directory, {
          signal,
        }));

        // wait
        await this.syncAddFileQueue.onIdle();

        // done - only finish if not aborted or new run is already in place
        if (signal.aborted || this.syncAbortController !== abortController) {
          debug('syncMediaTracks - operation aborted');
          return;
        }

        const syncDuration = performance.now() - syncStart;
        await MediaLibraryService.finishMediaTrackSync(MediaLocalConstants.Provider);

        mediaLocalStore.dispatch({
          type: MediaLocalStateActionType.FinishSync,
          data: {
            syncDuration,
          },
        });

        debug('syncMediaTracks - finished sync, took - %s', DateTimeUtils.formatDuration(syncDuration));
      } finally {
        finalize();
      }
    });
  }

  private addTracksFromDirectory(directory: string, options: { signal: AbortSignal }): Promise<void> {
    const { signal } = options;

    return new Promise((resolve) => {
      const scanTimestamp = Date.now();
      debug('addTracksFromDirectory - reading directory - %s, scan timestamp - %d', directory, scanTimestamp);

      IPCRenderer.stream(
        IPCCommChannel.FSReadDirectoryStream, {
          directory,
          fileExtensions: FSAudioExtensions,
        }, (data: { files: FSFile[] }) => {
          // on data
          this.addTracksFromFiles(directory, data.files, {
            scanTimestamp,
            signal,
          });

          // update stats
          mediaLocalStore.dispatch({
            type: MediaLocalStateActionType.IncrementDirectorySyncFilesFound,
            data: {
              directory,
              count: data.files.length,
            },
          });
        }, (err: Error) => {
          // on error
          // don't stop, just log
          console.error('Encountered error while reading directory - %s', directory);
          console.error(err);

          // update stats
          mediaLocalStore.dispatch({
            type: MediaLocalStateActionType.SetDirectorySyncError,
            data: {
              directory,
              error: err.message,
            },
          });
        }, () => {
          // on done
          debug('addTracksFromDirectory - finished reading directory - %s', directory);
          resolve();
        },
        signal,
      );
    });
  }

  private addTracksFromFiles(directory: string, files: FSFile[], options: { scanTimestamp: number, signal: AbortSignal }) {
    const { scanTimestamp, signal } = options;

    files.forEach((file) => {
      debug('addTracksFromFiles - found file at - %s, queueing...', file.path);

      this.syncAddFileQueue
        .add(async () => {
          if (signal.aborted) {
            debug('addTracksFromFiles - operation aborted, skipping - %s', file.name);
            return;
          }

          await this.addTrackFromFile(directory, file, {
            scanTimestamp,
          });

          // update stats
          mediaLocalStore.dispatch({
            type: MediaLocalStateActionType.IncrementDirectorySyncFilesAdded,
            data: {
              directory,
              count: 1,
            },
          });
        })
        .catch((err) => {
          console.error('addTracksFromFiles - encountered error while adding file - %s', file.name);
          console.error(err);
        });
    });
  }

  private async addTrackFromFile(directory: string, file: FSFile, options: { scanTimestamp: number }) {
    const { scanTimestamp } = options;
    debug('addTrackFromFile - adding file - %s', file.path);

    // generate local id - we are using location of the file to uniquely identify the track
    const mediaTrackId = MediaLocalLibraryService.getMediaId(file.path);

    // first check if we can simply mark it as seen; required both mtime and size for this to work
    if (isNumber(file.stats?.mtime) && isNumber(file.stats?.size)) {
      const mediaTrack = await MediaTrackService.updateMediaTrack({
        provider: MediaLocalConstants.Provider,
        provider_id: mediaTrackId,
        // @ts-ignore - can't get extra props to work with type checking
        'extra.file_mtime': file.stats?.mtime,
        'extra.file_size': file.stats?.size,
      }, {
        sync_timestamp: scanTimestamp,
      });

      if (mediaTrack) {
        // update media album
        await MediaAlbumService.updateMediaAlbum({
          id: mediaTrack.track_album_id,
        }, {
          sync_timestamp: scanTimestamp,
        });

        // update media artists
        await MediaArtistService.updateMediaArtists({
          id: {
            $in: mediaTrack.track_artists.map(artist => artist.id),
          },
        }, {
          sync_timestamp: scanTimestamp,
        });

        debug('addTrackFromFile - track at path %s already added %s, skipping...', file.path, mediaTrack.id);
        return mediaTrack;
      }
    }

    // read metadata
    const audioMetadata = await MediaLocalLibraryService.readAudioMetadataFromFile(file.path);
    // obtain cover image (important - there can be cases where audio has no cover image, handle accordingly)
    const audioCoverPicture = MediaLocalLibraryService.getAudioCoverPictureFromMetadata(audioMetadata);

    // #1: add media artist
    const mediaArtistDataList = await MediaLibraryService.checkAndInsertMediaArtists(audioMetadata.common.artists
      ? audioMetadata.common.artists.map(audioArtist => ({
        artist_name: audioArtist,
        provider: MediaLocalConstants.Provider,
        provider_id: MediaLocalLibraryService.getMediaId(audioArtist),
        sync_timestamp: scanTimestamp,
      }))
      : [{
        artist_name: 'unknown artist',
        provider: MediaLocalConstants.Provider,
        provider_id: MediaLocalLibraryService.getMediaId('unknown artist'),
        sync_timestamp: scanTimestamp,
      }]);

    // #2: add media album
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
      sync_timestamp: scanTimestamp,
    });

    // #3: add media track
    const mediaTrack = await MediaLibraryService.checkAndInsertMediaTrack({
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
        file_source: directory,
        file_path: file.path,
        file_mtime: file.stats?.mtime,
        file_size: file.stats?.size,
      },
      sync_timestamp: scanTimestamp,
    });

    debug('addTracksFromFiles - added track %s from file %s', mediaTrack.id, file.path);
    return mediaTrack;
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

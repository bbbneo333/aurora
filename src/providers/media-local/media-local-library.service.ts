import {
  IAudioMetadata,
  IPicture,
  parseFile,
  selectCover,
} from 'music-metadata';
import path from 'path';

import PQueue from 'p-queue';
import { Semaphore } from 'async-mutex';
import _, { isEmpty, isNumber } from 'lodash';

import { MediaEnums } from '../../enums';
import { IMediaLibraryService, IMediaPicture } from '../../interfaces';
import { DateTimeUtils } from '../../utils';

import {
  I18nService,
  MediaAlbumService,
  MediaArtistService,
  MediaLibraryService,
  MediaPlaylistService,
  MediaProviderService,
  MediaTrackService,
  NotificationService,
} from '../../services';

import {
  MediaAlbumDatastore,
  MediaArtistDatastore,
  MediaTrackDatastore,
} from '../../datastores';

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
  private syncFilesQueuedCount = 0;
  private syncFilesProcessedQueueCount = 0;

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
    const oldSettings = existingSettings as IMediaLocalSettings;
    const newSettings = updatedSettings as IMediaLocalSettings;
    const forceRescan = oldSettings.library?.group_compilations_by_folder !== newSettings.library?.group_compilations_by_folder;

    this.syncMediaTracks({ forceRescan, settings: newSettings })
      .then(() => {
        debug('onProviderSettingsUpdated - sync completed');
      });
  }

  async syncMediaTracks(options?: { forceRescan?: boolean, settings?: IMediaLocalSettings }) {
    const { forceRescan, settings: settingsOverride } = options || {};
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
    console.log('Reload Media Files start');

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
        this.syncFilesQueuedCount = 0;
        this.syncFilesProcessedQueueCount = 0;
        mediaLocalStore.dispatch({ type: MediaLocalStateActionType.StartSync });
        await MediaLibraryService.startMediaTrackSync(MediaLocalConstants.Provider);
        const settings: IMediaLocalSettings = settingsOverride || await MediaProviderService.getMediaProviderSettings(MediaLocalConstants.Provider);
        await Promise.map(settings.library.directories, directory => this.addTracksFromDirectory(directory, {
          signal,
          settings,
          forceRescan,
        }));

        // Wait for potential IPC delays/race conditions where 'complete' arrives before 'data'
        // This ensures the queue is populated before we check for idleness
        await new Promise(resolve => setTimeout(resolve, 2000));

        // wait for queue to empty and process all files
        debug('syncMediaTracks - waiting for queue to drain. Queued: %d, Processed: %d', this.syncFilesQueuedCount, this.syncFilesProcessedQueueCount);
        await this.syncAddFileQueue.onIdle();

        // Safety check: ensure all queued files are processed
        let retries = 0;
        while (this.syncFilesProcessedQueueCount < this.syncFilesQueuedCount && retries < 60) {
          debug('syncMediaTracks - waiting for processing completion... %d/%d', this.syncFilesProcessedQueueCount, this.syncFilesQueuedCount);
          // eslint-disable-next-line no-await-in-loop
          await new Promise(resolve => setTimeout(resolve, 1000));
          retries += 1;
        }

        // consolidate compilation albums
        await this.consolidateCompilationAlbums(settings);

        // process compilation album covers
        await this.processCompilationAlbumCovers(settings);

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

        // notification
        const { syncFilesFoundCount, syncFilesProcessedCount, syncFilesAddedCount } = mediaLocalStore.getState();
        if (syncFilesAddedCount > 0) {
          NotificationService.showMessage(I18nService.getString('message_sync_finished', {
            tracksAddedCount: syncFilesAddedCount,
          }));
        }

        // reload library
        MediaAlbumService.loadMediaAlbums();
        MediaArtistService.loadMediaArtists();
        MediaPlaylistService.loadMediaPlaylists();

        debug(
          'syncMediaTracks - finished sync, took - %s, found - %d, processed - %d, added - %d',
          DateTimeUtils.formatDuration(syncDuration),
          syncFilesFoundCount,
          syncFilesProcessedCount,
          syncFilesAddedCount,
        );
      } finally {
        finalize();
      }
    });
  }

  private addTracksFromDirectory(directory: string, options: { signal: AbortSignal, settings: IMediaLocalSettings, forceRescan?: boolean }): Promise<void> {
    const { signal, settings, forceRescan } = options;

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
            settings,
            forceRescan,
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

  private addTracksFromFiles(directory: string, files: FSFile[], options: { scanTimestamp: number, signal: AbortSignal, settings: IMediaLocalSettings, forceRescan?: boolean }) {
    const {
      scanTimestamp,
      signal,
      settings,
      forceRescan,
    } = options;

    files.forEach((file) => {
      debug('addTracksFromFiles - found file at - %s, queueing...', file.path);
      this.syncFilesQueuedCount += 1;

      this.syncAddFileQueue
        .add(async () => {
          try {
            if (signal.aborted) {
              debug('addTracksFromFiles - operation aborted, skipping - %s', file.name);
              return;
            }

            await this.addTrackFromFile(directory, file, {
              scanTimestamp,
              settings,
              forceRescan,
            });

            // update stats
            mediaLocalStore.dispatch({
              type: MediaLocalStateActionType.IncrementDirectorySyncFilesProcessed,
              data: {
                directory,
                count: 1,
              },
            });
          } finally {
            this.syncFilesProcessedQueueCount += 1;
          }
        })
        .catch((err) => {
          console.error('addTracksFromFiles - encountered error while adding file - %s', file.name);
          console.error(err);
        });
    });
  }

  private async addTrackFromFile(directory: string, file: FSFile, options: { scanTimestamp: number, settings: IMediaLocalSettings, forceRescan?: boolean }) {
    const { scanTimestamp, settings, forceRescan } = options;
    debug('addTrackFromFile - adding file - %s', file.path);

    // generate local id - we are using location of the file to uniquely identify the track
    const mediaTrackId = MediaLocalLibraryService.getMediaId(file.path);

    // first check if we can simply mark it as seen; required both mtime and size for this to work
    if (!forceRescan && isNumber(file.stats?.mtime) && isNumber(file.stats?.size)) {
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
        // if grouping is enabled, verify that the track is correctly grouped
        if (settings.library.group_compilations_by_folder) {
          const parentDir = path.dirname(file.path);
          let folderName = path.basename(parentDir);

          // Check if current folder is generic "Disc X" or "CD X"
          if (folderName.match(/^(disc|cd)\s*\d+$/i)) {
            const grandParentDir = path.dirname(parentDir);
            const parentName = path.basename(grandParentDir);
            folderName = `${parentName} (${folderName})`;
          }

          // Extract year if present in folder name (e.g. "Album Name (2024)")
          const yearMatch = folderName.match(/\s*\((\d{4})\)/);
          if (yearMatch) {
            folderName = folderName.replace(yearMatch[0], '');
          }

          // Check if album name matches the folder name (cleaned)
          const isGrouped = mediaTrack.track_album.album_name === folderName;

          if (!isGrouped) {
            debug('addTrackFromFile - track %s needs grouping update, falling back to full scan', file.path);
          } else {
            // update media album
            await MediaAlbumService.updateMediaAlbum({
              id: mediaTrack.track_album_id,
            }, {
              sync_timestamp: scanTimestamp,
            });

            // update media artists
            await MediaArtistService.updateMediaArtists({
              id: {
                $in: [
                  mediaTrack.track_album.album_artist_id,
                  ...mediaTrack.track_artists.map(artist => artist.id),
                ],
              },
            }, {
              sync_timestamp: scanTimestamp,
            });

            debug('addTrackFromFile - track at path %s already added %s, skipping...', file.path, mediaTrack.id);
            return mediaTrack;
          }
        } else {
          // update media album
          await MediaAlbumService.updateMediaAlbum({
            id: mediaTrack.track_album_id,
          }, {
            sync_timestamp: scanTimestamp,
          });

          // update media artists
          await MediaArtistService.updateMediaArtists({
            id: {
              $in: [
                mediaTrack.track_album.album_artist_id,
                ...mediaTrack.track_artists.map(artist => artist.id),
              ],
            },
          }, {
            sync_timestamp: scanTimestamp,
          });

          debug('addTrackFromFile - track at path %s already added %s, skipping...', file.path, mediaTrack.id);
          return mediaTrack;
        }
      }
    }

    // read metadata
    const audioMetadata = await MediaLocalLibraryService.readAudioMetadataFromFile(file.path);

    let effectiveFolderForGrouping: string | undefined;
    if (settings.library.group_compilations_by_folder) {
      const parentDir = path.dirname(file.path);
      let folderName = path.basename(parentDir);
      // If current folder is a disc folder (e.g., "Disc 1" or "CD 2"), use the parent directory name as album
      // and try to set disc number from folder suffix to keep discs separated logically
      if (/^(disc|cd)\s*\d+$/i.test(folderName)) {
        const grandParentDir = path.dirname(parentDir);
        const parentName = path.basename(grandParentDir);
        const discMatch = folderName.match(/(disc|cd)\s*(\d+)/i);
        folderName = parentName;
        effectiveFolderForGrouping = grandParentDir;
        if (discMatch && audioMetadata.common) {
          // ensure disk structure exists
          // @ts-ignore - music-metadata typings allow partials at runtime
          audioMetadata.common.disk = audioMetadata.common.disk || {};
          // @ts-ignore
          audioMetadata.common.disk.no = parseInt(discMatch[2], 10);
        }
      } else {
        effectiveFolderForGrouping = parentDir;
      }

      // Extract year if present in folder name (e.g. "Album Name (2024)")
      const yearMatch = folderName.match(/\s*\((\d{4})\)$/);
      if (yearMatch) {
        if (audioMetadata.common) {
          audioMetadata.common.year = parseInt(yearMatch[1], 10);
        }
        folderName = folderName.replace(yearMatch[0], '');
      }

      if (audioMetadata.common) {
        audioMetadata.common.album = folderName;
        // We do NOT force 'Various Artists' here anymore.
        // Instead, we let the consolidation process handle mixed albums later.
      }
    }

    // obtain cover image (important - there can be cases where audio has no cover image, handle accordingly)
    const audioCoverPicture = MediaLocalLibraryService.getAudioCoverPictureFromMetadata(audioMetadata);

    if (settings.library.group_compilations_by_folder) {
      // debug(`[DEBUG-IMPORT] File: ${file.path}`);
      // debug(`[DEBUG-IMPORT] Grouping enabled. Folder: ${effectiveFolderForGrouping}, Album Name: ${audioMetadata.common.album}`);
    }

    // #1: add media artists
    // - track artist(s) are at udioMetadata.common.artists - always present
    // - album artist is at audioMetadata.common.albumartist - sometimes present, if not - first one from track artist
    const mediaArtists = await MediaLibraryService.checkAndInsertMediaArtists(audioMetadata.common.artists
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

    const mediaAlbumArtist = isEmpty(audioMetadata.common.albumartist)
      ? mediaArtists[0]
      : await MediaLibraryService.checkAndInsertMediaArtist({
        artist_name: audioMetadata.common.albumartist as string,
        provider: MediaLocalConstants.Provider,
        provider_id: MediaLocalLibraryService.getMediaId(audioMetadata.common.albumartist as string),
        sync_timestamp: scanTimestamp,
      });

    // #2: add media album
    const mediaAlbumName = audioMetadata.common.album || 'unknown album';
    const mediaAlbumProviderId = MediaLocalLibraryService.getMediaId(mediaAlbumArtist.artist_name, mediaAlbumName);

    const mediaAlbumData = await MediaLibraryService.checkAndInsertMediaAlbum({
      album_name: mediaAlbumName,
      album_artist_id: mediaAlbumArtist.id,
      album_genre: audioMetadata.common.genre ? audioMetadata.common.genre[0] : undefined,
      album_year: audioMetadata.common.year,
      album_cover_picture: audioCoverPicture ? {
        image_data: audioCoverPicture.data,
        image_data_type: MediaEnums.MediaTrackCoverPictureImageDataType.Buffer,
      } : undefined,
      provider: MediaLocalConstants.Provider,
      provider_id: mediaAlbumProviderId,
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
      track_artist_ids: mediaArtists.map(mediaArtist => mediaArtist.id),
      track_album_id: mediaAlbumData.id,
      extra: {
        file_source: effectiveFolderForGrouping || path.dirname(file.path),
        file_path: file.path,
        file_mtime: file.stats?.mtime,
        file_size: file.stats?.size,
      },
      sync_timestamp: scanTimestamp,
    });

    // update stats
    mediaLocalStore.dispatch({
      type: MediaLocalStateActionType.IncrementDirectorySyncFilesAdded,
      data: {
        directory,
        count: 1,
      },
    });

    debug('addTracksFromFiles - added track %s from file %s', mediaTrack.id, file.path);
    return mediaTrack;
  }

  private static getMediaId(...mediaInput: string[]): string {
    return CryptoService.sha256(...mediaInput);
  }

  private static readAudioMetadataFromFile(filePath: string): Promise<IAudioMetadata> {
    return parseFile(filePath);
  }

  private static getAudioCoverPictureFromMetadata(audioMetadata: IAudioMetadata): IPicture | null {
    return selectCover(audioMetadata.common.picture);
  }

  private async consolidateCompilationAlbums(settings: IMediaLocalSettings): Promise<void> {
    if (!settings.library.group_compilations_by_folder) {
      return;
    }
    debug('consolidateCompilationAlbums - starting consolidation');

    // Find all tracks with file_source (directory)
    const tracks = await MediaTrackDatastore.findMediaTracks({
      provider: MediaLocalConstants.Provider,
      'extra.file_source': { $exists: true },
    } as any);

    // Group by directory
    const tracksByDir = _.groupBy(tracks, (t: any) => t.extra?.file_source);

    // Process each directory
    await Promise.map(Object.keys(tracksByDir), async (dir) => {
      const dirTracks = tracksByDir[dir];
      if (isEmpty(dirTracks)) {
        return;
      }

      const albumIds = _.uniq(dirTracks.map((t: any) => t.track_album_id));

      if (albumIds.length <= 1) {
        return;
      }

      // Found split album! Check if they share the same album name
      // eslint-disable-next-line no-underscore-dangle
      // @ts-ignore
      // eslint-disable-next-line no-underscore-dangle
      // @ts-ignore
      const albums = await MediaAlbumDatastore.findMediaAlbums({ id: { $in: albumIds } });
      const albumNames = _.uniq(albums.map((a: any) => a.album_name));

      let targetAlbumName = albumNames[0];
      let targetArtistName = 'Various Artists';

      // If multiple albums, use folder name as album name
      if (albumNames.length > 1) {
        targetAlbumName = path.basename(dir);
        const yearMatch = targetAlbumName.match(/\s*\((\d{4})\)$/);
        if (yearMatch) {
          targetAlbumName = targetAlbumName.replace(yearMatch[0], '');
        }
      }

      // Determine target artist
      const albumArtistIds = _.uniq(albums.map((a: any) => a.album_artist_id));
      const artists = await MediaArtistDatastore.findMediaArtists({ id: { $in: albumArtistIds } });
      const artistNames = artists.map((a: any) => a.artist_name);

      // Heuristic 0: Check if there is only one unique artist
      const uniqueArtists = _.uniqBy(artistNames, (name: string) => name.toLowerCase());
      if (uniqueArtists.length === 1) {
        targetArtistName = uniqueArtists[0];
      } else {
        // Heuristic 1: Check if one artist is a prefix of all others (e.g. "Adele" vs "Adele feat. X")
        const shortestArtist = _.minBy(artistNames, 'length');
        if (shortestArtist) {
          const allStartsWithShortest = artistNames.every(name => name.toLowerCase().startsWith(shortestArtist.toLowerCase()));
          if (allStartsWithShortest) {
            targetArtistName = shortestArtist;
          }
        }

        // Heuristic 2: Check folder name matches an artist
        if (targetArtistName === 'Various Artists') {
          const folderName = path.basename(dir);
          const matchingArtist = artistNames.find(name => folderName.toLowerCase().startsWith(name.toLowerCase()));
          if (matchingArtist) {
            targetArtistName = matchingArtist;
          }
        }
      }

      debug('consolidateCompilationAlbums - consolidating album %s in %s into %s - %s', targetAlbumName, dir, targetArtistName, targetAlbumName);

      // Find or Create target artist
      // @ts-ignore
      let targetArtist = await MediaArtistDatastore.findMediaArtist({
        provider: MediaLocalConstants.Provider,
        provider_id: MediaLocalLibraryService.getMediaId(targetArtistName),
      });

      if (!targetArtist) {
        targetArtist = await MediaLibraryService.checkAndInsertMediaArtist({
          artist_name: targetArtistName,
          provider: MediaLocalConstants.Provider,
          provider_id: MediaLocalLibraryService.getMediaId(targetArtistName),
          sync_timestamp: Date.now(),
        });
      }

      const targetAlbumId = MediaLocalLibraryService.getMediaId(targetArtistName, targetAlbumName);
      // @ts-ignore
      let targetAlbum = await MediaAlbumDatastore.findMediaAlbum({ provider_id: targetAlbumId });

      if (!targetAlbum) {
        // Create it using metadata from the first album
        const firstAlbum = albums[0];
        targetAlbum = await MediaLibraryService.checkAndInsertMediaAlbum({
          album_name: targetAlbumName,
          // eslint-disable-next-line no-underscore-dangle
          album_artist_id: targetArtist.id || (targetArtist as any)._id,
          album_genre: firstAlbum.album_genre,
          album_year: firstAlbum.album_year,
          album_cover_picture: firstAlbum.album_cover_picture,
          provider: MediaLocalConstants.Provider,
          provider_id: targetAlbumId,
          sync_timestamp: Date.now(),
        });
      }

      // Move tracks to consolidated album
      // eslint-disable-next-line no-underscore-dangle
      // @ts-ignore
      await MediaTrackDatastore.updateMediaTracks(
        // eslint-disable-next-line no-underscore-dangle
        { id: { $in: dirTracks.map((t: any) => t.id) } },
        // eslint-disable-next-line no-underscore-dangle
        { track_album_id: targetAlbum.id || (targetAlbum as any)._id },
      );

      // Generate collage if needed (immediate update)
      // Get tracks for this album (could be more than just this dir if existing album)
      // But for collage we might want to prioritize variety
      const currentTracks = await MediaTrackService.getMediaAlbumTracks(targetAlbum.id);
      const coverPictures = _.uniqBy(
        currentTracks
          .filter(track => track.track_cover_picture && track.track_cover_picture.image_data_type === MediaEnums.MediaTrackCoverPictureImageDataType.Path)
          .map(track => track.track_cover_picture as IMediaPicture),
        'image_data',
      ).slice(0, 4);

      if (coverPictures.length > 1) {
        const collageBuffer = await this.createCollage(coverPictures);
        if (collageBuffer) {
          const processedPicture = await MediaLibraryService.processPicture({
            image_data: collageBuffer,
            image_data_type: MediaEnums.MediaTrackCoverPictureImageDataType.Buffer,
          });
          if (processedPicture) {
            await MediaAlbumService.updateMediaAlbum({ id: targetAlbum.id }, { album_cover_picture: processedPicture });
          }
        }
      }

      // Delete old albums if empty
      // eslint-disable-next-line no-underscore-dangle
      const targetAlbumResolvedId = targetAlbum ? (targetAlbum.id || (targetAlbum as any)._id) : undefined;
      if (!targetAlbumResolvedId) {
        return;
      }
      const oldAlbumIds = albumIds.filter(id => id !== targetAlbumResolvedId);

      await Promise.map(oldAlbumIds, async (oldId) => {
        // @ts-ignore
        const count = await MediaTrackDatastore.countMediaTracks({ track_album_id: oldId });
        if (count === 0) {
          // @ts-ignore
          await MediaAlbumDatastore.deleteAlbums({ id: oldId });
        }
      });
    }, { concurrency: 4 });

    debug('consolidateCompilationAlbums - finished consolidation');
  }

  private async processCompilationAlbumCovers(settings: IMediaLocalSettings): Promise<void> {
    if (!settings.library.group_compilations_by_folder) {
      return;
    }

    const mediaAlbums = await MediaAlbumService.getMediaAlbums();
    const compilationAlbums = mediaAlbums.filter(album => (
      album.provider === MediaLocalConstants.Provider
      && album.album_artist.artist_name === 'Various Artists'
    ));

    await Promise.map(compilationAlbums, async (album) => {
      const tracks = await MediaTrackService.getMediaAlbumTracks(album.id);
      if (isEmpty(tracks)) {
        return;
      }

      const coverPictures = _.uniqBy(
        tracks
          .filter(track => track.track_cover_picture && track.track_cover_picture.image_data_type === MediaEnums.MediaTrackCoverPictureImageDataType.Path)
          .map(track => track.track_cover_picture as IMediaPicture),
        'image_data',
      ).slice(0, 4);

      if (coverPictures.length <= 1) {
        return;
      }

      // Generate collage
      const collageBuffer = await this.createCollage(coverPictures);
      if (!collageBuffer) {
        return;
      }

      const processedPicture = await MediaLibraryService.processPicture({
        image_data: collageBuffer,
        image_data_type: MediaEnums.MediaTrackCoverPictureImageDataType.Buffer,
      });

      if (processedPicture) {
        await MediaAlbumService.updateMediaAlbum({
          id: album.id,
        }, {
          album_cover_picture: processedPicture,
        });
      }
    }, { concurrency: 4 });
  }

  private createCollage(pictures: IMediaPicture[]): Promise<Buffer | null> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }

      const size = 500;
      canvas.width = size;
      canvas.height = size;

      // Draw background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, size, size);

      const count = pictures.length;
      let loadedCount = 0;
      const images: HTMLImageElement[] = [];

      const onImageLoad = () => {
        loadedCount += 1;
        if (loadedCount === count) {
          // All images loaded, draw them
          if (count === 4) {
            ctx.drawImage(images[0], 0, 0, size / 2, size / 2);
            ctx.drawImage(images[1], size / 2, 0, size / 2, size / 2);
            ctx.drawImage(images[2], 0, size / 2, size / 2, size / 2);
            ctx.drawImage(images[3], size / 2, size / 2, size / 2, size / 2);
          } else if (count === 3) {
            ctx.drawImage(images[0], 0, 0, size / 2, size / 2);
            ctx.drawImage(images[1], size / 2, 0, size / 2, size / 2);
            ctx.drawImage(images[2], 0, size / 2, size, size / 2);
          } else if (count === 2) {
            ctx.drawImage(images[0], 0, 0, size / 2, size);
            ctx.drawImage(images[1], size / 2, 0, size / 2, size);
          }

          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          const buffer = Buffer.from(dataUrl.split(',')[1], 'base64');
          resolve(buffer);
        }
      };

      pictures.forEach((picture) => {
        const img = new Image();
        images.push(img); // Push before setting src to avoid race condition
        img.onload = onImageLoad;
        img.onerror = onImageLoad; // Continue even if error
        img.src = `file://${picture.image_data}`;
      });
    });
  }
}

export default new MediaLocalLibraryService();

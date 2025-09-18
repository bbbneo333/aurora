import _ from 'lodash';
import { Semaphore } from 'async-mutex';

import { AppEnums, MediaLibraryActions, MediaTrackCoverPictureImageDataType } from '../enums';
import store from '../store';
import { DataStoreInputData } from '../types';
import { MediaUtils } from '../utils';

import AppService from './app.service';
import MediaPlayerService from './media-player.service';

import {
  MediaAlbumDatastore,
  MediaArtistDatastore,
  MediaProviderDatastore,
  MediaTrackDatastore,
} from '../datastores';

import {
  IMediaAlbum,
  IMediaAlbumData,
  IMediaArtist,
  IMediaArtistData,
  IMediaPicture,
  IMediaTrack,
  IMediaTrackData,
} from '../interfaces';

export type MediaSyncFunction = () => Promise<void>;

const debug = require('debug')('app:service:media_library_service');

class MediaLibraryService {
  readonly mediaPictureScaleWidth = 500;
  readonly mediaPictureScaleHeight = 500;
  private readonly mediaSyncLock = new Semaphore(1);

  async syncMedia(mediaProviderIdentifier: string, syncFn: MediaSyncFunction): Promise<void> {
    await this.mediaSyncLock.runExclusive(async () => {
      await this.startMediaTrackSync(mediaProviderIdentifier);
      await syncFn();
      await this.finishMediaTrackSync(mediaProviderIdentifier);
    });
  }

  async checkAndInsertMediaArtists(mediaArtistInputDataList: DataStoreInputData<IMediaArtistData>[]): Promise<IMediaArtist[]> {
    return Promise.all(mediaArtistInputDataList.map(mediaArtistInputData => this.checkAndInsertMediaArtist(mediaArtistInputData)));
  }

  async checkAndInsertMediaArtist(mediaArtistInputData: DataStoreInputData<IMediaArtistData>): Promise<IMediaArtist> {
    let mediaArtistData;

    if (!_.isNil(mediaArtistInputData.provider_id)) {
      mediaArtistData = await MediaArtistDatastore.findMediaArtist({
        provider: mediaArtistInputData.provider,
        provider_id: mediaArtistInputData.provider_id,
      });
    } else {
      throw new Error('Provider id is required for checkAndInsertMediaArtist');
    }

    if (mediaArtistData) {
      mediaArtistData = await MediaArtistDatastore.updateArtistById(mediaArtistData.id, _.pick(mediaArtistInputData, [
        'sync_timestamp',
        'artist_name',
        'extra',
      ]));
    } else {
      mediaArtistData = await MediaArtistDatastore.insertMediaArtist({
        provider: mediaArtistInputData.provider,
        provider_id: mediaArtistInputData.provider_id,
        sync_timestamp: mediaArtistInputData.sync_timestamp,
        artist_name: mediaArtistInputData.artist_name,
        artist_feature_picture: await this.processPicture(mediaArtistInputData.artist_feature_picture),
        extra: mediaArtistInputData.extra,
      });
    }

    return this.buildMediaArtist(mediaArtistData, true);
  }

  async checkAndInsertMediaAlbum(mediaAlbumInputData: DataStoreInputData<IMediaAlbumData>): Promise<IMediaAlbum> {
    let mediaTrackAlbumData;

    if (!_.isNil(mediaAlbumInputData.provider_id)) {
      mediaTrackAlbumData = await MediaAlbumDatastore.findMediaAlbum({
        provider: mediaAlbumInputData.provider,
        provider_id: mediaAlbumInputData.provider_id,
      });
    } else {
      throw new Error('Provider id is required for checkAndInsertMediaAlbum');
    }

    if (mediaTrackAlbumData) {
      mediaTrackAlbumData = await MediaAlbumDatastore.updateAlbumById(mediaTrackAlbumData.id, _.pick(mediaAlbumInputData, [
        'sync_timestamp',
        'album_name',
        'album_artist_id',
        'extra',
      ]));
    } else {
      mediaTrackAlbumData = await MediaAlbumDatastore.insertMediaAlbum({
        provider: mediaAlbumInputData.provider,
        provider_id: mediaAlbumInputData.provider_id,
        sync_timestamp: mediaAlbumInputData.sync_timestamp,
        album_name: mediaAlbumInputData.album_name,
        album_artist_id: mediaAlbumInputData.album_artist_id,
        album_cover_picture: await this.processPicture(mediaAlbumInputData.album_cover_picture),
        extra: mediaAlbumInputData.extra,
      });
    }

    return this.buildMediaAlbum(mediaTrackAlbumData, true);
  }

  async checkAndInsertMediaTrack(mediaTrackInputData: DataStoreInputData<IMediaTrackData>): Promise<IMediaTrack> {
    let mediaTrackData;

    if (!_.isNil(mediaTrackInputData.provider_id)) {
      mediaTrackData = await MediaTrackDatastore.findMediaTrack({
        provider: mediaTrackInputData.provider,
        provider_id: mediaTrackInputData.provider_id,
      });
    } else {
      throw new Error('Provider id is required for checkAndInsertMediaTrack');
    }

    if (mediaTrackData) {
      mediaTrackData = await MediaTrackDatastore.updateTrackById(mediaTrackData.id, _.pick(mediaTrackInputData, [
        'sync_timestamp',
        'track_name',
        'track_number',
        'track_duration',
        'track_artist_ids',
        'track_album_id',
        'extra',
      ]));
    } else {
      mediaTrackData = await MediaTrackDatastore.insertMediaTrack({
        provider: mediaTrackInputData.provider,
        provider_id: mediaTrackInputData.provider_id,
        sync_timestamp: mediaTrackInputData.sync_timestamp,
        track_name: mediaTrackInputData.track_name,
        track_number: mediaTrackInputData.track_number,
        track_duration: mediaTrackInputData.track_duration,
        track_cover_picture: await this.processPicture(mediaTrackInputData.track_cover_picture),
        track_artist_ids: mediaTrackInputData.track_artist_ids,
        track_album_id: mediaTrackInputData.track_album_id,
        extra: mediaTrackInputData.extra,
      });
    }

    return this.buildMediaTrack(mediaTrackData, true);
  }

  async searchTracksByName(query: string): Promise<IMediaTrack[]> {
    const tracks = await MediaTrackDatastore.findMediaTracks({
      track_name: {
        $regex: new RegExp(query, 'i'),
      },
    });

    return this.buildMediaTracks(tracks);
  }

  async searchAlbumsByName(query: string): Promise<IMediaAlbum[]> {
    const albums = await MediaAlbumDatastore.findMediaAlbums({
      album_name: {
        $regex: new RegExp(query, 'i'),
      },
    });

    return this.buildMediaAlbums(albums);
  }

  async searchArtistsByName(query: string): Promise<IMediaArtist[]> {
    const artists = await MediaArtistDatastore.findMediaArtists({
      artist_name: {
        $regex: new RegExp(query, 'i'),
      },
    });

    return this.buildMediaArtists(artists);
  }

  async getMediaTrack(mediaTrackId: string): Promise<IMediaTrack | undefined> {
    const mediaTrackData = await MediaTrackDatastore.findMediaTrack({
      id: mediaTrackId,
    });

    return mediaTrackData ? this.buildMediaTrack(mediaTrackData) : undefined;
  }

  async getMediaTrackForProvider(provider: string, provider_id: string): Promise<IMediaTrack | undefined> {
    const mediaTrackData = await MediaTrackDatastore.findMediaTrack({
      provider,
      provider_id,
    });

    return mediaTrackData ? this.buildMediaTrack(mediaTrackData) : undefined;
  }

  async getMediaAlbumTracks(mediaAlbumId: string): Promise<IMediaTrack[]> {
    const mediaAlbumTrackDataList = await MediaTrackDatastore.findMediaTracks({
      track_album_id: mediaAlbumId,
    });

    const mediaAlbumTracks = await this.buildMediaTracks(mediaAlbumTrackDataList);
    return MediaUtils.sortMediaAlbumTracks(mediaAlbumTracks);
  }

  async getMediaArtistTracks(mediaArtistId: string): Promise<IMediaTrack[]> {
    const mediaTrackDataList = await MediaTrackDatastore.findMediaTracks({
      track_artist_ids: [mediaArtistId],
    });

    const mediaTracks = await this.buildMediaTracks(mediaTrackDataList);
    return MediaUtils.sortMediaArtistTracks(mediaTracks);
  }

  async getMediaAlbum(albumId: string): Promise<IMediaAlbum | undefined> {
    const albumData = await MediaAlbumDatastore.findMediaAlbumById(albumId);
    return albumData ? this.buildMediaAlbum(albumData) : undefined;
  }

  async getMediaAlbums(): Promise<IMediaAlbum[]> {
    const mediaAlbumDataList = await MediaAlbumDatastore.findMediaAlbums();

    const mediaAlbums = await Promise.all(mediaAlbumDataList.map(mediaAlbumData => this.buildMediaAlbum(mediaAlbumData)));
    return MediaUtils.sortMediaAlbums(mediaAlbums);
  }

  async getMediaArtist(artistId: string): Promise<IMediaArtist | undefined> {
    const artistData = await MediaArtistDatastore.findMediaArtistById(artistId);
    return artistData ? this.buildMediaArtist(artistData) : undefined;
  }

  async getMediaArtists(): Promise<IMediaArtist[]> {
    const mediaArtistDataList = await MediaArtistDatastore.findMediaArtists();

    const mediaArtists = await Promise.all(mediaArtistDataList.map(mediaArtistData => this.buildMediaArtist(mediaArtistData)));
    return MediaUtils.sortMediaArtists(mediaArtists);
  }

  async getMediaArtistAlbums(mediaArtistId: string): Promise<IMediaAlbum[]> {
    const mediaAlbumDataList = await MediaAlbumDatastore.findMediaAlbums({
      album_artist_id: mediaArtistId,
    });

    const mediaAlbums = await Promise.all(mediaAlbumDataList.map(mediaAlbumData => this.buildMediaAlbum(mediaAlbumData)));
    return MediaUtils.sortMediaAlbums(mediaAlbums);
  }

  loadMediaAlbums(): void {
    this
      .getMediaAlbums()
      .then((mediaAlbums) => {
        store.dispatch({
          type: MediaLibraryActions.SetAlbums,
          data: {
            mediaAlbums,
          },
        });
      });
  }

  loadMediaAlbum(mediaAlbumId: string): void {
    this
      .getMediaAlbumTracks(mediaAlbumId)
      .then(async (mediaAlbumTracks) => {
        store.dispatch({
          type: MediaLibraryActions.SetAlbum,
          data: {
            mediaAlbum: await this.getMediaAlbum(mediaAlbumId),
            mediaAlbumTracks,
          },
        });
      });
  }

  loadMediaArtists(): void {
    this
      .getMediaArtists()
      .then((mediaArtists) => {
        store.dispatch({
          type: MediaLibraryActions.SetArtists,
          data: {
            mediaArtists,
          },
        });
      });
  }

  loadMediaArtist(mediaArtistId: string): void {
    this
      .getMediaArtistAlbums(mediaArtistId)
      .then(async (mediaArtistAlbums) => {
        store.dispatch({
          type: MediaLibraryActions.SetArtist,
          data: {
            mediaArtist: await this.getMediaArtist(mediaArtistId),
            mediaArtistAlbums,
          },
        });
      });
  }

  private async startMediaTrackSync(mediaProviderIdentifier: string): Promise<void> {
    const mediaProviderData = await MediaProviderDatastore.findMediaProviderByIdentifier(mediaProviderIdentifier);
    if (!mediaProviderData) {
      throw new Error(`MediaLibraryService encountered error at startMediaTrackSync - Provider not found - ${mediaProviderIdentifier}`);
    }

    const mediaSyncStartTimestamp = Date.now();
    await MediaProviderDatastore.updateMediaProviderByIdentifier(mediaProviderIdentifier, {
      sync_started_at: mediaSyncStartTimestamp,
      sync_finished_at: null,
    });
    debug('started sync for provider %s at %d', mediaProviderIdentifier, mediaSyncStartTimestamp);

    store.dispatch({
      type: MediaLibraryActions.StartSync,
      data: {
        mediaProviderIdentifier,
      },
    });
  }

  private async finishMediaTrackSync(mediaProviderIdentifier: string): Promise<void> {
    const mediaProviderData = await MediaProviderDatastore.findMediaProviderByIdentifier(mediaProviderIdentifier);
    if (!mediaProviderData) {
      throw new Error(`MediaLibraryService encountered error at finishMediaTrackSync - Provider not found - ${mediaProviderIdentifier}`);
    }
    if (!mediaProviderData.sync_started_at || mediaProviderData.sync_finished_at) {
      throw new Error('MediaLibraryService encountered error at finishMediaTrackSync - Invalid sync state');
    }

    // delete unsync'd media - media which is older than start of the sync
    // important - this will only delete it from store, state still needs to be managed
    const mediaSyncStartTimestamp = mediaProviderData.sync_started_at;
    await this.deleteUnsyncMedia(mediaProviderIdentifier, mediaSyncStartTimestamp);
    await MediaPlayerService.revalidatePlayer();

    // update provider
    const mediaSyncEndTimestamp = Date.now();
    await MediaProviderDatastore.updateMediaProviderByIdentifier(mediaProviderIdentifier, {
      sync_finished_at: mediaSyncEndTimestamp,
    });
    debug('finished sync for provider %s at %d', mediaProviderIdentifier, mediaSyncEndTimestamp);

    store.dispatch({
      type: MediaLibraryActions.FinishSync,
      data: {
        mediaProviderIdentifier,
        mediaSyncStartTimestamp,
      },
    });
  }

  private async buildMediaTrack(mediaTrackData: IMediaTrackData, loadMediaTrack = false): Promise<IMediaTrack> {
    const mediaTrack = _.assign({}, mediaTrackData, {
      track_artists: await this.buildMediaArtists(mediaTrackData.track_artist_ids, loadMediaTrack),
      track_album: await this.buildMediaAlbum(mediaTrackData.track_album_id, loadMediaTrack),
    });

    if (loadMediaTrack) {
      store.dispatch({
        type: MediaLibraryActions.AddTrack,
        data: {
          mediaTrack,
        },
      });
    }

    return mediaTrack;
  }

  private async buildMediaTracks(mediaTrackDataList: IMediaTrackData[], loadMediaTracks = false): Promise<IMediaTrack[]> {
    return Promise.all(mediaTrackDataList.map(mediaTrackData => this.buildMediaTrack(mediaTrackData, loadMediaTracks)));
  }

  private async buildMediaAlbum(mediaAlbum: string | IMediaAlbumData, loadMediaAlbum = false): Promise<IMediaAlbum> {
    let mediaAlbumData;
    if (typeof mediaAlbum === 'string') {
      mediaAlbumData = await MediaAlbumDatastore.findMediaAlbumById(mediaAlbum);

      if (!mediaAlbumData) {
        throw new Error(`MediaLibraryService encountered error at buildMediaAlbum - Could not find album - ${mediaAlbum}`);
      }
    } else {
      mediaAlbumData = mediaAlbum;
    }

    const mediaAlbumArtist = await this.getMediaArtist(mediaAlbumData.album_artist_id);
    if (!mediaAlbumArtist) {
      throw new Error(`Encountered error while build media album - ${mediaAlbumData.id} - Could not find artist with id - ${mediaAlbumData.album_artist_id}`);
    }

    const mediaAlbumBuilt = _.assign({}, mediaAlbumData, {
      album_artist: mediaAlbumArtist,
    });

    if (loadMediaAlbum) {
      store.dispatch({
        type: MediaLibraryActions.AddAlbum,
        data: {
          mediaAlbum: mediaAlbumBuilt,
        },
      });
    }

    return mediaAlbumBuilt;
  }

  private async buildMediaAlbums(mediaAlbums: string[] | IMediaAlbumData[], loadMediaAlbums = false): Promise<IMediaAlbum[]> {
    return Promise.all(mediaAlbums.map((mediaAlbum: any) => this.buildMediaAlbum(mediaAlbum, loadMediaAlbums)));
  }

  private async buildMediaArtist(mediaArtist: string | IMediaArtistData, loadMediaArtist = false): Promise<IMediaArtist> {
    // info - no further processing required for MediaArtistData -> MediaArtist
    let mediaArtistData;
    if (typeof mediaArtist === 'string') {
      mediaArtistData = await MediaArtistDatastore.findMediaArtistById(mediaArtist);

      if (!mediaArtistData) {
        throw new Error(`MediaLibraryService encountered error at buildMediaArtist - Could not find artist - ${mediaArtist}`);
      }
    } else {
      mediaArtistData = mediaArtist;
    }

    if (loadMediaArtist) {
      store.dispatch({
        type: MediaLibraryActions.AddArtist,
        data: {
          mediaArtist: mediaArtistData,
        },
      });
    }

    return mediaArtistData;
  }

  private async buildMediaArtists(mediaArtists: string[] | IMediaArtistData[], loadMediaArtists = false): Promise<IMediaArtist[]> {
    return Promise.all(mediaArtists.map((mediaArtist: any) => this.buildMediaArtist(mediaArtist, loadMediaArtists)));
  }

  private async processPicture(mediaPicture?: IMediaPicture): Promise<IMediaPicture | undefined> {
    // this accepts a MediaPicture and returns a serializable instance of MediaPicture which can be stored and
    // further processed system-wide after deserializing
    if (!mediaPicture) {
      return undefined;
    }

    if (mediaPicture.image_data_type === MediaTrackCoverPictureImageDataType.Buffer) {
      let imageCachePath;

      try {
        imageCachePath = await AppService.sendAsyncMessage(AppEnums.IPCCommChannels.MediaScaleAndCacheImage, mediaPicture.image_data, {
          width: this.mediaPictureScaleWidth,
          height: this.mediaPictureScaleHeight,
        });
      } catch (error) {
        debug('encountered error while processing image - %s', error);
      }

      if (!imageCachePath) {
        return undefined;
      }

      return {
        image_data: imageCachePath,
        image_data_type: MediaTrackCoverPictureImageDataType.Path,
      };
    }

    // image data type does not need any processing, return as is
    return mediaPicture;
  }

  private async deleteUnsyncMedia(mediaProviderIdentifier: string, mediaSyncStartTimestamp: number): Promise<void> {
    await MediaTrackDatastore.deleteTracks({
      provider: mediaProviderIdentifier,
      sync_timestamp: {
        $lt: mediaSyncStartTimestamp,
      },
    });
    await MediaAlbumDatastore.deleteAlbums({
      provider: mediaProviderIdentifier,
      sync_timestamp: {
        $lt: mediaSyncStartTimestamp,
      },
    });
    await MediaArtistDatastore.deleteArtists({
      provider: mediaProviderIdentifier,
      sync_timestamp: {
        $lt: mediaSyncStartTimestamp,
      },
    });
  }
}

export default new MediaLibraryService();

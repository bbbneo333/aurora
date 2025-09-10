import {
  assign, defaults, isEmpty, isNil,
} from 'lodash';

import { Semaphore } from 'async-mutex';

import { AppEnums, MediaEnums } from '../enums';
import { DatastoreUtils, MediaUtils } from '../utils';
import store from '../store';
import { AppError, DataStoreInputData, DataStoreUpdateData } from '../types';

import AppService from './app.service';
import MediaPlayerService from './media-player.service';
import I18nService from './i18n.service';
import NotificationService from './notification.service';

import {
  MediaAlbumDatastore,
  MediaArtistDatastore,
  MediaProviderDatastore,
  MediaTrackDatastore,
  MediaPlaylistDatastore,
} from '../datastores';

import {
  IMediaAlbum,
  IMediaAlbumData,
  IMediaArtist,
  IMediaArtistData,
  IMediaCollectionItem,
  IMediaPicture,
  IMediaPlaylist,
  IMediaPlaylistData,
  IMediaPlaylistInputData,
  IMediaPlaylistTrack,
  IMediaPlaylistTrackData,
  IMediaPlaylistTrackInputData,
  IMediaPlaylistTrackUpdateData,
  IMediaPlaylistUpdateData,
  IMediaTrack,
  IMediaTrackData,
} from '../interfaces';

export type MediaSyncFunction = () => Promise<void>;

export type MediaSearchResults = {
  tracks: IMediaTrack[],
  artists: IMediaArtist[],
  albums: IMediaAlbum[],
  playlists: IMediaPlaylist[],
};

const debug = require('debug')('app:service:media_library_service');

export class MediaLibraryPlaylistDuplicateTracksError extends AppError {
  existingTrackDataList: IMediaPlaylistTrackInputData[] = [];
  newTrackDataList: IMediaPlaylistTrackInputData[] = [];

  constructor(
    existingTrackDataList: IMediaPlaylistTrackInputData[],
    newTrackDataList: IMediaPlaylistTrackInputData[] = [],
  ) {
    super('Duplicate tracks found in playlist');
    this.name = 'MediaLibraryPlaylistDuplicateTracksError';
    this.existingTrackDataList = existingTrackDataList;
    this.newTrackDataList = newTrackDataList;
  }
}

class MediaLibraryService {
  readonly mediaPictureScaleWidth = 500;
  readonly mediaPictureScaleHeight = 500;
  private readonly mediaSyncLock = new Semaphore(1);

  // sync API

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

    if (!isNil(mediaArtistInputData.provider_id)) {
      mediaArtistData = await MediaArtistDatastore.findMediaArtist({
        provider: mediaArtistInputData.provider,
        provider_id: mediaArtistInputData.provider_id,
      });
    } else {
      throw new Error('Provider id is required for checkAndInsertMediaArtist');
    }

    if (mediaArtistData) {
      mediaArtistData = await MediaArtistDatastore.updateArtistById(mediaArtistData.id, {
        sync_timestamp: mediaArtistInputData.sync_timestamp,
      });
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

    if (!isNil(mediaAlbumInputData.provider_id)) {
      mediaTrackAlbumData = await MediaAlbumDatastore.findMediaAlbum({
        provider: mediaAlbumInputData.provider,
        provider_id: mediaAlbumInputData.provider_id,
      });
    } else {
      throw new Error('Provider id is required for checkAndInsertMediaAlbum');
    }

    if (mediaTrackAlbumData) {
      mediaTrackAlbumData = await MediaAlbumDatastore.updateAlbumById(mediaTrackAlbumData.id, {
        sync_timestamp: mediaAlbumInputData.sync_timestamp,
      });
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

    if (!isNil(mediaTrackInputData.provider_id)) {
      mediaTrackData = await MediaTrackDatastore.findMediaTrack({
        provider: mediaTrackInputData.provider,
        provider_id: mediaTrackInputData.provider_id,
      });
    } else {
      throw new Error('Provider id is required for checkAndInsertMediaTrack');
    }

    if (mediaTrackData) {
      mediaTrackData = await MediaTrackDatastore.updateTrackById(mediaTrackData.id, {
        sync_timestamp: mediaTrackInputData.sync_timestamp,
      });
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

  // search API

  async search(query: string): Promise<MediaSearchResults> {
    return {
      tracks: await this.searchTracksByName(query),
      albums: await this.searchAlbumsByName(query),
      artists: await this.searchArtistsByName(query),
      playlists: await this.searchPlaylistsByName(query),
    };
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

  async searchPlaylistsByName(query: string): Promise<IMediaPlaylist[]> {
    const playlists = await MediaPlaylistDatastore.findMediaPlaylists({
      name: {
        $regex: new RegExp(query, 'i'),
      },
    });

    return this.buildMediaPlaylists(playlists);
  }

  // fetch API

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

  async getMediaPlaylist(mediaPlaylistId: string): Promise<IMediaPlaylist | undefined> {
    const mediaPlaylistData = await MediaPlaylistDatastore.findMediaPlaylist({
      id: mediaPlaylistId,
    });

    return mediaPlaylistData ? this.buildMediaPlaylist(mediaPlaylistData) : undefined;
  }

  async getMediaPlaylistTracks(mediaPlaylistId: string): Promise<IMediaPlaylistTrack[]> {
    const playlist = await this.getMediaPlaylist(mediaPlaylistId);
    if (!playlist) {
      throw new Error(`MediaLibraryService encountered error at getMediaPlaylistTracks - Playlist not found - ${mediaPlaylistId}`);
    }

    return this.buildMediaPlaylistTracks(playlist.tracks);
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

  async getMediaAlbums(): Promise<IMediaAlbum[]> {
    const mediaAlbumDataList = await MediaAlbumDatastore.findMediaAlbums();

    const mediaAlbums = await Promise.all(mediaAlbumDataList.map(mediaAlbumData => this.buildMediaAlbum(mediaAlbumData)));
    return MediaUtils.sortMediaAlbums(mediaAlbums);
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

  async getMediaCollectionTracks(mediaCollectionItem: IMediaCollectionItem): Promise<IMediaTrack[]> {
    switch (mediaCollectionItem.type) {
      case 'album': {
        return this.getMediaAlbumTracks(mediaCollectionItem.id);
      }
      case 'artist': {
        return this.getMediaArtistTracks(mediaCollectionItem.id);
      }
      case 'playlist': {
        return this.getMediaPlaylistTracks(mediaCollectionItem.id);
      }
      default:
        throw new Error(`Unsupported media collection type - ${mediaCollectionItem.type}`);
    }
  }

  async getMediaPlaylists(): Promise<IMediaPlaylist[]> {
    const mediaPlaylistsDataList = await MediaPlaylistDatastore.findMediaPlaylists();

    const mediaPlaylists = await Promise.all(
      mediaPlaylistsDataList.map(mediaPlaylistData => this.buildMediaPlaylist(mediaPlaylistData)),
    );

    return MediaUtils.sortMediaPlaylists(mediaPlaylists);
  }

  // create API

  async createMediaPlaylist(mediaPlaylistInputData?: IMediaPlaylistInputData): Promise<IMediaPlaylist> {
    const inputData: DataStoreInputData<IMediaPlaylistData> = defaults(mediaPlaylistInputData, {
      name: await this.getDefaultNewPlaylistName(),
      tracks: [],
      created_at: Date.now(),
    });
    inputData.tracks = inputData.tracks.map(trackInputData => this.buildMediaPlaylistTrackFromInput(trackInputData));

    const mediaPlaylistData = await MediaPlaylistDatastore.insertMediaPlaylist(inputData);
    const mediaPlaylist = await this.buildMediaPlaylist(mediaPlaylistData);

    store.dispatch({
      type: MediaEnums.MediaLibraryActions.AddPlaylist,
      data: {
        mediaPlaylist,
      },
    });

    return mediaPlaylist;
  }

  /**
   * @throws MediaLibraryPlaylistDuplicateTracksError
   */
  async addMediaPlaylistTracks(mediaPlaylistId: string, mediaPlaylistTrackInputDataList: IMediaPlaylistTrackInputData[], options?: {
    // allowDuplicates: boolean;
    ignoreExisting?: boolean; // only add new ones
  }): Promise<IMediaPlaylist> {
    const {
      existingInputDataList,
      newInputDataList,
    } = await this.getExistingMediaPlaylistTrackInputData(
      mediaPlaylistId,
      mediaPlaylistTrackInputDataList,
    );

    if (!isEmpty(existingInputDataList) && !options?.ignoreExisting) {
      // not allowed to add duplicate tracks, throw error
      throw new MediaLibraryPlaylistDuplicateTracksError(existingInputDataList, newInputDataList);
    }

    // all good
    const mediaPlaylistData = await MediaPlaylistDatastore.addMediaPlaylistTracks(
      mediaPlaylistId,
      mediaPlaylistTrackInputDataList.map(trackInputData => this.buildMediaPlaylistTrackFromInput(trackInputData)),
    );

    const mediaPlaylistUpdated = await this.buildMediaPlaylist(mediaPlaylistData);

    store.dispatch({
      type: MediaEnums.MediaLibraryActions.AddPlaylist,
      data: {
        mediaPlaylist: mediaPlaylistUpdated,
      },
    });

    NotificationService.showMessage(I18nService.getString('message_added_to_playlist', {
      playlistName: mediaPlaylistUpdated.name,
    }));

    return mediaPlaylistUpdated;
  }

  // load API

  loadMediaAlbums(): void {
    this
      .getMediaAlbums()
      .then((mediaAlbums) => {
        store.dispatch({
          type: MediaEnums.MediaLibraryActions.SetAlbums,
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
          type: MediaEnums.MediaLibraryActions.SetAlbum,
          data: {
            mediaAlbum: await this.buildMediaAlbum(mediaAlbumId),
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
          type: MediaEnums.MediaLibraryActions.SetArtists,
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
          type: MediaEnums.MediaLibraryActions.SetArtist,
          data: {
            mediaArtist: await this.buildMediaArtist(mediaArtistId),
            mediaArtistAlbums,
          },
        });
      });
  }

  loadMediaPlaylists(): void {
    this
      .getMediaPlaylists()
      .then((mediaPlaylists) => {
        store.dispatch({
          type: MediaEnums.MediaLibraryActions.SetPlaylists,
          data: {
            mediaPlaylists,
          },
        });
      });
  }

  loadMediaPlaylist(mediaPlaylistId: string): void {
    this
      .getMediaPlaylist(mediaPlaylistId)
      .then((mediaPlaylist) => {
        store.dispatch({
          type: MediaEnums.MediaLibraryActions.SetPlaylist,
          data: {
            mediaPlaylist,
          },
        });
      });
  }

  // update API

  async updateMediaPlaylist(mediaPlaylistId: string, mediaPlaylistUpdateData: IMediaPlaylistUpdateData): Promise<IMediaPlaylist> {
    const mediaPlaylistData = await MediaPlaylistDatastore.updateMediaPlaylist(mediaPlaylistId, await this.buildMediaPlaylistUpdateDataFromInput(mediaPlaylistId, mediaPlaylistUpdateData));
    const mediaPlaylist = await this.buildMediaPlaylist(mediaPlaylistData);

    store.dispatch({
      type: MediaEnums.MediaLibraryActions.AddPlaylist,
      data: {
        mediaPlaylist,
      },
    });

    return mediaPlaylist;
  }

  // delete API

  async deleteMediaPlaylist(mediaPlaylistId: string): Promise<void> {
    await MediaPlaylistDatastore.deleteMediaPlaylist({
      id: mediaPlaylistId,
    });

    store.dispatch({
      type: MediaEnums.MediaLibraryActions.RemovePlaylist,
      data: {
        mediaPlaylistId,
      },
    });

    NotificationService.showMessage(I18nService.getString('message_playlist_deleted'));
  }

  async deleteMediaPlaylistTracks(mediaPlaylistId: string, mediaPlaylistTrackIds: string[]): Promise<IMediaPlaylist> {
    const mediaPlaylistData = await MediaPlaylistDatastore.deleteMediaPlaylistTracks(mediaPlaylistId, mediaPlaylistTrackIds);
    const mediaPlaylist = await this.buildMediaPlaylist(mediaPlaylistData);

    store.dispatch({
      type: MediaEnums.MediaLibraryActions.AddPlaylist,
      data: {
        mediaPlaylist,
      },
    });

    return mediaPlaylist;
  }

  // private API

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
      type: MediaEnums.MediaLibraryActions.StartSync,
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
      type: MediaEnums.MediaLibraryActions.FinishSync,
      data: {
        mediaProviderIdentifier,
        mediaSyncStartTimestamp,
      },
    });
  }

  private async buildMediaTrack(mediaTrackData: IMediaTrackData, loadMediaTrack = false): Promise<IMediaTrack> {
    const mediaTrack = assign({}, mediaTrackData, {
      track_artists: await this.buildMediaArtists(mediaTrackData.track_artist_ids, loadMediaTrack),
      track_album: await this.buildMediaAlbum(mediaTrackData.track_album_id, loadMediaTrack),
    });

    if (loadMediaTrack) {
      store.dispatch({
        type: MediaEnums.MediaLibraryActions.AddTrack,
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

    const mediaAlbumBuilt = assign({}, mediaAlbumData, {
      album_artist: await this.buildMediaArtist(mediaAlbumData.album_artist_id),
    });

    if (loadMediaAlbum) {
      store.dispatch({
        type: MediaEnums.MediaLibraryActions.AddAlbum,
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
        type: MediaEnums.MediaLibraryActions.AddArtist,
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

    if (mediaPicture.image_data_type === MediaEnums.MediaTrackCoverPictureImageDataType.Buffer) {
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
        image_data_type: MediaEnums.MediaTrackCoverPictureImageDataType.Path,
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

  private async buildMediaPlaylist(mediaPlaylistData: IMediaPlaylistData) {
    return assign(mediaPlaylistData, {});
  }

  private async buildMediaPlaylists(mediaPlaylistDataList: IMediaPlaylistData[]) {
    return Promise.all(mediaPlaylistDataList.map((mediaPlaylistData: any) => this.buildMediaPlaylist(mediaPlaylistData)));
  }

  private async buildMediaPlaylistTracks(mediaPlaylistTrackDataList: IMediaPlaylistTrackData[]): Promise<IMediaPlaylistTrack[]> {
    // TODO: Added a hack here to ignore playlist tracks that could not be found locally anymore
    //  Ideally, such entries should have a status like "unavailable"

    // @ts-ignore
    return Promise
      .all(mediaPlaylistTrackDataList.map(mediaPlaylistTrackData => this.buildMediaPlaylistTrack(mediaPlaylistTrackData)))
      .then(mediaPlaylistTracks => mediaPlaylistTracks.filter(mediaPlaylistTrack => !isNil(mediaPlaylistTrack)));
  }

  private async buildMediaPlaylistTrack(mediaPlaylistTrackData: IMediaPlaylistTrackData): Promise<IMediaPlaylistTrack | undefined> {
    const mediaTrack = await this.getMediaTrackForProvider(mediaPlaylistTrackData.provider, mediaPlaylistTrackData.provider_id);
    if (!mediaTrack) {
      return undefined;
    }

    return assign({}, mediaPlaylistTrackData, mediaTrack);
  }

  private async getDefaultNewPlaylistName(): Promise<string> {
    const mediaPlaylistsCount = await MediaPlaylistDatastore.countMediaPlaylists();

    return `${I18nService.getString('label_new_playlist_default_name', {
      playlistCount: (mediaPlaylistsCount + 1).toString(),
    })}`;
  }

  private buildMediaPlaylistTrackFromInput(trackInputData: IMediaPlaylistTrackInputData): IMediaPlaylistTrackData {
    return {
      playlist_track_id: DatastoreUtils.generateId(),
      provider: trackInputData.provider,
      provider_id: trackInputData.provider_id,
      added_at: Date.now(),
    };
  }

  private async buildMediaPlaylistUpdateDataFromInput(playlistId: string, playlistUpdateData: IMediaPlaylistUpdateData): Promise<DataStoreUpdateData<IMediaPlaylistData>> {
    const data: DataStoreUpdateData<IMediaPlaylistData> = {};
    if (playlistUpdateData.name) {
      data.name = playlistUpdateData.name;
    }
    if (playlistUpdateData.cover_picture) {
      data.cover_picture = playlistUpdateData.cover_picture;
    }
    if (playlistUpdateData.tracks) {
      data.tracks = await this.buildMediaPlaylistTrackUpdateDataFromInput(playlistId, playlistUpdateData.tracks);
    }

    return data;
  }

  private async buildMediaPlaylistTrackUpdateDataFromInput(playlistId: string, playlistTrackUpdateDataList: IMediaPlaylistTrackUpdateData[]): Promise<IMediaPlaylistTrackData[]> {
    // we got tracks to update, we only get playlist_track_id in the order we required
    // we also can have deleted ids, no addition is allowed
    // build the new set of playlist tracks in order we require and set them directly
    const playlistData = await MediaPlaylistDatastore.findMediaPlaylist({
      id: playlistId,
    });
    if (!playlistData) {
      throw new Error(`MediaLibraryService encountered error at buildMediaPlaylistTrackUpdateDataFromInput - Could not find playlist - ${playlistId}`);
    }

    const playlistUpdatedTracks: IMediaPlaylistTrackData[] = [];
    playlistTrackUpdateDataList.forEach((trackUpdateData) => {
      const playlistTrackData = playlistData.tracks.find(
        trackData => trackData.playlist_track_id === trackUpdateData.playlist_track_id,
      );
      // no addition allowed
      if (!playlistTrackData) {
        throw new Error(`MediaLibraryService encountered error at buildMediaPlaylistTrackUpdateDataFromInput - Could not find track in playlist - ${trackUpdateData.playlist_track_id}`);
      }

      playlistUpdatedTracks.push(playlistTrackData);
    });

    return playlistUpdatedTracks;
  }

  private async getExistingMediaPlaylistTrackInputData(mediaPlaylistId: string, mediaPlaylistTrackInputDataList: IMediaPlaylistTrackInputData[]): Promise<{
    existingInputDataList: IMediaPlaylistTrackInputData[],
    newInputDataList: IMediaPlaylistTrackInputData[],
  }> {
    const playlist = await this.getMediaPlaylist(mediaPlaylistId);
    if (!playlist) {
      throw new Error(`MediaLibraryService encountered error at getExistingMediaPlaylistTrackInputData - Playlist not found - ${mediaPlaylistId}`);
    }

    const existingInputDataList: IMediaPlaylistTrackInputData[] = [];
    const newInputDataList: IMediaPlaylistTrackInputData[] = [];

    mediaPlaylistTrackInputDataList.forEach((trackData) => {
      const playlistTrack = playlist.tracks.find(
        data => data.provider === trackData.provider && data.provider_id === trackData.provider_id,
      );
      if (playlistTrack) {
        // existing track
        existingInputDataList.push(trackData);
      } else {
        // new track
        newInputDataList.push(trackData);
      }
    });

    return {
      existingInputDataList,
      newInputDataList,
    };
  }
}

export default new MediaLibraryService();

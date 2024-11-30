import { isNil, assign, defaults } from 'lodash';
import { Semaphore } from 'async-mutex';

import { AppEnums, MediaEnums } from '../enums';
import { MediaUtils } from '../utils';
import AppService from './app.service';
import store from '../store';
import { DataStoreInputData } from '../types';
import MediaPlayerService from './media-player.service';

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
  IMediaTrack,
  IMediaTrackData,
} from '../interfaces';
import I18nService from './i18n.service';

type MediaSyncFunction = () => Promise<void>;

const debug = require('debug')('app:service:media_library_service');

class MediaLibraryService {
  private readonly mediaPictureScaleWidth = 500;
  private readonly mediaPictureScaleHeight = 500;
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
      mediaArtistData = await MediaArtistDatastore.findMediaArtist({
        provider: mediaArtistInputData.provider,
        artist_name: mediaArtistInputData.artist_name,
      });
    }

    if (mediaArtistData) {
      mediaArtistData = await MediaArtistDatastore.updateArtistById(mediaArtistData.id, {
        ...mediaArtistInputData,
        artist_feature_picture: await this.processPicture(mediaArtistInputData.artist_feature_picture),
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
      mediaTrackAlbumData = await MediaAlbumDatastore.findMediaAlbum({
        provider: mediaAlbumInputData.provider,
        album_name: mediaAlbumInputData.album_name,
      });
    }

    if (mediaTrackAlbumData) {
      mediaTrackAlbumData = await MediaAlbumDatastore.updateAlbumById(mediaTrackAlbumData.id, {
        ...mediaAlbumInputData,
        album_cover_picture: await this.processPicture(mediaAlbumInputData.album_cover_picture),
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
    }

    if (mediaTrackData) {
      mediaTrackData = await MediaTrackDatastore.updateTrackById(mediaTrackData.id, {
        ...mediaTrackInputData,
        track_cover_picture: await this.processPicture(mediaTrackInputData.track_cover_picture),
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

  // fetch API

  async getMediaTrack(mediaTrackId: string): Promise<IMediaTrack | undefined> {
    const mediaTrackData = await MediaTrackDatastore.findMediaTrack({
      id: mediaTrackId,
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
    inputData.tracks = inputData.tracks.map(trackInputData => ({
      id: trackInputData.id,
      added_at: Date.now(),
    }));

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

  async addMediaTracksToPlaylist(mediaPlaylistId: string, mediaPlaylistTracks: IMediaPlaylistTrackInputData[]): Promise<IMediaPlaylist> {
    const mediaPlaylistData = await MediaPlaylistDatastore.insertMediaTracksIntoPlaylist(mediaPlaylistId, mediaPlaylistTracks.map(trackInputData => ({
      id: trackInputData.id,
      added_at: Date.now(),
    })));

    const mediaPlaylist = await this.buildMediaPlaylist(mediaPlaylistData);

    store.dispatch({
      type: MediaEnums.MediaLibraryActions.AddPlaylist,
      data: {
        mediaPlaylist,
      },
    });

    return mediaPlaylist;
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
          type: MediaEnums.MediaLibraryActions.AddArtists,
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
      const imageCached: {
        path?: string,
      } = await AppService.sendAsyncMessage(AppEnums.IPCCommChannels.MediaScaleAndCacheImage, mediaPicture.image_data, {
        width: this.mediaPictureScaleWidth,
        height: this.mediaPictureScaleHeight,
      });

      // imageCached: {processed: boolean, path?: string, error?: string}
      // path would not be present if image could not be processed
      // most likely due to corrupted image
      if (!imageCached.path) {
        return undefined;
      }

      return {
        ...mediaPicture,
        image_data: imageCached.path,
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
    return assign({}, mediaPlaylistData);
  }

  private async buildMediaPlaylistTracks(mediaPlaylistTrackDataList: IMediaPlaylistTrackData[]): Promise<IMediaPlaylistTrack[]> {
    return Promise.all(mediaPlaylistTrackDataList.map(mediaPlaylistTrackData => this.buildMediaPlaylistTrack(mediaPlaylistTrackData)));
  }

  private async buildMediaPlaylistTrack(mediaPlaylistTrackData: IMediaPlaylistTrackData): Promise<IMediaPlaylistTrack> {
    const mediaTrack = await this.getMediaTrack(mediaPlaylistTrackData.id);

    return assign({}, mediaPlaylistTrackData, mediaTrack);
  }

  private async getDefaultNewPlaylistName(): Promise<string> {
    const mediaPlaylistsCount = await MediaPlaylistDatastore.countMediaPlaylists();

    return `${I18nService.getString('label_new_playlist_default_name', {
      playlistCount: (mediaPlaylistsCount + 1).toString(),
    })}`;
  }
}

export default new MediaLibraryService();

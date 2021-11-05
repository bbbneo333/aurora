import * as _ from 'lodash';

import {MediaEnums} from '../enums';
import {DatastoreUtils} from '../utils';

import {
  MediaAlbumDatastore,
  MediaArtistDatastore,
  MediaProviderDatastore,
  MediaTrackDatastore,
} from '../datastores';

import {
  IMediaAlbum,
  IMediaAlbumData,
  IMediaAlbumProviderData,
  IMediaArtist,
  IMediaArtistData,
  IMediaArtistProviderData,
  IMediaTrack,
  IMediaTrackData,
  IMediaTrackDataUpdateParams,
  IMediaTrackProviderData,
} from '../interfaces';

import MediaProviderService from './media-provider.service';
import store from '../store';

class MediaLibraryService {
  async insertMediaTrack(mediaProviderIdentifier: string, mediaTrackProviderData: IMediaTrackProviderData): Promise<IMediaTrack> {
    const mediaTrackData = await this.checkAndInsertMediaTrack(mediaProviderIdentifier, mediaTrackProviderData);
    return this.buildMediaTrack(mediaTrackData, true);
  }

  async removeMediaTrack(mediaTrack: IMediaTrack): Promise<void> {
    const {mediaLibraryService} = MediaProviderService.getMediaProvider(mediaTrack.provider);

    // a media track can be removed via one of the following ways:
    // - if provider provides removeMediaTrack - then the media track will be removed completely
    // - if provider does not provides removeMediaTrack - then the media track will be marked as removed and will not show up in the lists
    // provider then has the option to recover removed tracks via recoverRemovedTracks
    if (mediaLibraryService.removeMediaTrack) {
      const mediaTrackWasRemoved = await mediaLibraryService.removeMediaTrack(mediaTrack);
      if (!mediaTrackWasRemoved) {
        throw new Error(`MediaLibraryService encountered error at removeMediaTrack - Media track could not be removed for provider - ${mediaTrack.provider}, track id - ${mediaTrack.id}`);
      }
      await MediaTrackDatastore.removeMediaTrackById(mediaTrack.id);
    } else {
      await MediaTrackDatastore.updateMediaTrackById(mediaTrack.id, {
        removed: true,
      });
    }

    store.dispatch({
      type: MediaEnums.MediaLibraryActions.RemoveTrack,
      data: {
        mediaTrack,
      },
    });
  }

  async startMediaTrackSync(mediaProviderIdentifier: string): Promise<string> {
    const mediaProviderData = await MediaProviderDatastore.findMediaProviderByIdentifier(mediaProviderIdentifier);
    if (!mediaProviderData) {
      throw new Error(`MediaLibraryService encountered error at startMediaTrackSync - Provider not found - ${mediaProviderIdentifier}`);
    }

    const mediaSyncStartTimestamp = Date.now();
    const mediaSyncKey = mediaSyncStartTimestamp.toString();
    await MediaProviderDatastore.updateMediaProviderByIdentifier(mediaProviderIdentifier, {
      library: {
        last_sync_key: mediaSyncKey,
        last_sync_started_at: mediaSyncStartTimestamp,
        last_sync_finished_at: null,
      },
    });

    store.dispatch({
      type: MediaEnums.MediaLibraryActions.StartSync,
      data: {
        mediaProviderIdentifier,
      },
    });

    return mediaSyncKey;
  }

  async finishMediaTrackSync(mediaProviderIdentifier: string, mediaSyncKey: string): Promise<void> {
    const mediaProviderData = await MediaProviderDatastore.findMediaProviderByIdentifier(mediaProviderIdentifier);
    if (!mediaProviderData) {
      throw new Error(`MediaLibraryService encountered error at finishMediaTrackSync - Provider not found - ${mediaProviderIdentifier}`);
    }
    if (!mediaProviderData.library.last_sync_key || mediaProviderData.library.last_sync_key !== mediaSyncKey || mediaProviderData.library.last_sync_finished_at) {
      throw new Error('MediaLibraryService encountered error at finishMediaTrackSync - Invalid sync state');
    }

    await this.removeUnSyncTracks(mediaProviderIdentifier, mediaSyncKey);
    await MediaProviderDatastore.updateMediaProviderByIdentifier(mediaProviderIdentifier, {
      library: {
        last_sync_key: mediaSyncKey,
        last_sync_started_at: mediaProviderData.library.last_sync_started_at,
        last_sync_finished_at: Date.now(),
      },
    });

    store.dispatch({
      type: MediaEnums.MediaLibraryActions.FinishSync,
      data: {
        mediaProviderIdentifier,
      },
    });
  }

  async syncMediaTracks(mediaProviderIdentifier: string): Promise<void> {
    const {mediaLibraryService} = await MediaProviderService.getMediaProvider(mediaProviderIdentifier);
    await mediaLibraryService.syncMediaTracks();
  }

  loadMediaAlbum(mediaAlbum: IMediaAlbum): void {
    MediaTrackDatastore
      .findMediaTracks({
        provider: mediaAlbum.provider,
        track_album_id: mediaAlbum.id,
        removed: false,
      })
      .then(async (mediaAlbumTrackDataList) => {
        store.dispatch({
          type: MediaEnums.MediaLibraryActions.LoadAlbum,
          data: {
            mediaAlbum,
            mediaAlbumTracks: await this.buildMediaTracks(mediaAlbumTrackDataList),
          },
        });
      });
  }

  loadMediaArtist(mediaArtist: IMediaArtist): void {
    MediaAlbumDatastore
      .findMediaAlbums({
        provider: mediaArtist.provider,
        album_artist_id: mediaArtist.id,
      })
      .then(async (mediaAlbumDataList) => {
        store.dispatch({
          type: MediaEnums.MediaLibraryActions.LoadAlbum,
          data: {
            mediaArtist,
            mediaArtistAlbums: await this.buildMediaAlbums(mediaAlbumDataList),
          },
        });
      });
  }

  private async removeUnSyncTracks(mediaProviderIdentifier: string, mediaSyncKey: string): Promise<void> {
    await MediaTrackDatastore.removeMediaTracks({
      provider_id: mediaProviderIdentifier,
      sync: {
        last_sync_key: mediaSyncKey,
      },
    });
  }

  private async buildMediaTrack(mediaTrackData: IMediaTrackData, loadMediaTrack = false): Promise<IMediaTrack> {
    const mediaTrack = _.assign({}, mediaTrackData, {
      track_artists: await this.buildMediaArtists(mediaTrackData.track_artist_ids, loadMediaTrack),
      track_album: await this.buildMediaAlbum(mediaTrackData.track_album_id, loadMediaTrack),
    });

    if (loadMediaTrack && !mediaTrackData.removed) {
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

  private async buildMediaAlbum(mediaAlbum: string|IMediaAlbumData, loadMediaAlbum = false): Promise<IMediaAlbum> {
    let mediaAlbumData;
    if (typeof mediaAlbum === 'string') {
      mediaAlbumData = await MediaAlbumDatastore.findMediaAlbumById(mediaAlbum);

      if (!mediaAlbumData) {
        throw new Error(`MediaLibraryService encountered error at buildMediaAlbum - Could not find album - ${mediaAlbum}`);
      }
    } else {
      mediaAlbumData = mediaAlbum;
    }

    const mediaAlbumBuilt = _.assign({}, mediaAlbumData, {
      album_artist: await this.buildMediaArtist(mediaAlbumData.album_artist_id),
    });

    if (loadMediaAlbum) {
      store.dispatch({
        type: MediaEnums.MediaLibraryActions.AddAlbumSafe,
        data: {
          mediaAlbum: mediaAlbumBuilt,
        },
      });
    }

    return mediaAlbumBuilt;
  }

  private async buildMediaAlbums(mediaAlbums: string[]|IMediaAlbumData[], loadMediaAlbums = false): Promise<IMediaAlbum[]> {
    return Promise.all(mediaAlbums.map((mediaAlbum: any) => this.buildMediaAlbum(mediaAlbum, loadMediaAlbums)));
  }

  private async buildMediaArtist(mediaArtist: string|IMediaArtistData, loadMediaArtist = false): Promise<IMediaArtist> {
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
        type: MediaEnums.MediaLibraryActions.AddArtistSafe,
        data: {
          mediaArtist: mediaArtistData,
        },
      });
    }

    return mediaArtistData;
  }

  private async buildMediaArtists(mediaArtists: string[]|IMediaArtistData[], loadMediaArtists = false): Promise<IMediaArtist[]> {
    return Promise.all(mediaArtists.map((mediaArtist: any) => this.buildMediaArtist(mediaArtist, loadMediaArtists)));
  }

  private async checkAndInsertMediaArtist(mediaProviderIdentifier: string, mediaArtistProviderData: IMediaArtistProviderData): Promise<IMediaArtistData> {
    let mediaArtistData;
    if (!_.isNil(mediaArtistProviderData.provider_id)) {
      mediaArtistData = await MediaArtistDatastore.findMediaArtist({
        provider: mediaProviderIdentifier,
        provider_id: mediaArtistProviderData.provider_id,
      });
    } else {
      mediaArtistData = await MediaArtistDatastore.findMediaArtist({
        provider: mediaProviderIdentifier,
        artist_name: mediaArtistProviderData.artist_name,
      });
    }

    return mediaArtistData || MediaArtistDatastore.insertMediaArtist({
      id: DatastoreUtils.generateId(),
      provider: mediaProviderIdentifier,
      provider_id: mediaArtistProviderData.provider_id,
      artist_name: mediaArtistProviderData.artist_name,
      // TODO: Add back support for MediaPicture once BufferImage processing issue is fixed
      // artist_display_picture: mediaArtistProviderData.artist_feature_picture,
      // artist_feature_picture: mediaArtistProviderData.artist_feature_picture,
      extra: mediaArtistProviderData.extra,
    });
  }

  private async checkAndInsertMediaArtists(mediaProviderIdentifier: string, mediaArtistProviderDataList: IMediaArtistProviderData[]): Promise<IMediaArtistData[]> {
    return Promise.all(mediaArtistProviderDataList.map(mediaArtistProviderData => this.checkAndInsertMediaArtist(mediaProviderIdentifier, mediaArtistProviderData)));
  }

  private async checkAndInsertMediaAlbum(mediaProviderIdentifier: string, mediaAlbumProviderData: IMediaAlbumProviderData): Promise<IMediaAlbumData> {
    let mediaTrackAlbum;
    if (!_.isNil(mediaAlbumProviderData.provider_id)) {
      mediaTrackAlbum = await MediaAlbumDatastore.findMediaAlbum({
        provider: mediaProviderIdentifier,
        provider_id: mediaAlbumProviderData.provider_id,
      });
    } else {
      mediaTrackAlbum = await MediaAlbumDatastore.findMediaAlbum({
        provider: mediaProviderIdentifier,
        album_name: mediaAlbumProviderData.album_name,
      });
    }
    if (mediaTrackAlbum) {
      return mediaTrackAlbum;
    }

    const mediaAlbumArtistData = await this.checkAndInsertMediaArtist(mediaProviderIdentifier, mediaAlbumProviderData.album_artist);

    return MediaAlbumDatastore.insertMediaAlbum({
      id: DatastoreUtils.generateId(),
      provider: mediaProviderIdentifier,
      provider_id: mediaAlbumProviderData.provider_id,
      album_name: mediaAlbumProviderData.album_name,
      album_artist_id: mediaAlbumArtistData.id,
      // TODO: Add back support for MediaPicture once BufferImage processing issue is fixed
      // album_cover_picture: mediaAlbumProviderData.album_cover_picture,
      extra: mediaAlbumProviderData.extra,
    });
  }

  private async checkAndInsertMediaTrack(mediaProviderIdentifier: string, mediaTrackProviderData: IMediaTrackProviderData): Promise<IMediaTrackData> {
    const mediaSyncTimestamp = Date.now();

    let mediaTrackData;
    if (!_.isNil(mediaTrackProviderData.provider_id)) {
      mediaTrackData = await MediaTrackDatastore.findMediaTrack({
        provider: mediaProviderIdentifier,
        provider_id: mediaTrackProviderData.provider_id,
      });
    }

    if (mediaTrackData) {
      const mediaTrackUpdateParams: IMediaTrackDataUpdateParams = {
        sync: {
          last_sync_key: mediaTrackProviderData.sync.sync_key,
          last_sync_at: mediaSyncTimestamp,
        },
      };
      // update track
      await MediaTrackDatastore.updateMediaTrackById(mediaTrackData.id, mediaTrackUpdateParams);
      // conclude with the updated track data
      return _.merge(mediaTrackData, mediaTrackUpdateParams);
    }

    const mediaArtistDataList = await this.checkAndInsertMediaArtists(mediaProviderIdentifier, mediaTrackProviderData.track_artists);
    const mediaAlbumData = await this.checkAndInsertMediaAlbum(mediaProviderIdentifier, mediaTrackProviderData.track_album);

    return MediaTrackDatastore.insertMediaTrack({
      id: DatastoreUtils.generateId(),
      provider: mediaProviderIdentifier,
      provider_id: mediaTrackProviderData.provider_id,
      track_name: mediaTrackProviderData.track_name,
      track_number: mediaTrackProviderData.track_number,
      track_duration: mediaTrackProviderData.track_duration,
      // TODO: Add back support for MediaPicture once BufferImage processing issue is fixed
      // track_cover_picture: mediaTrackProviderData.track_cover_picture,
      track_artist_ids: mediaArtistDataList.map(mediaArtistData => (mediaArtistData.id)),
      track_album_id: mediaAlbumData.id,
      removed: false,
      sync: {
        last_sync_key: mediaTrackProviderData.sync.sync_key,
        last_sync_at: mediaSyncTimestamp,
      },
      extra: mediaTrackProviderData.extra,
    });
  }
}

export default new MediaLibraryService();

import _ from 'lodash';

import { AppEnums, MediaEnums } from '../enums';
import { MediaUtils } from '../utils';
import AppService from './app.service';
import store from '../store';
import { DataStoreInputData } from '../types';

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

const debug = require('debug')('app:service:media_library_service');

class MediaLibraryService {
  private readonly mediaPictureScaleWidth = 500;
  private readonly mediaPictureScaleHeight = 500;

  // sync API

  async startMediaTrackSync(mediaProviderIdentifier: string): Promise<void> {
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

  async finishMediaTrackSync(mediaProviderIdentifier: string): Promise<void> {
    const mediaProviderData = await MediaProviderDatastore.findMediaProviderByIdentifier(mediaProviderIdentifier);
    if (!mediaProviderData) {
      throw new Error(`MediaLibraryService encountered error at finishMediaTrackSync - Provider not found - ${mediaProviderIdentifier}`);
    }
    if (mediaProviderData.sync_finished_at) {
      throw new Error('MediaLibraryService encountered error at finishMediaTrackSync - Invalid sync state');
    }

    const mediaSyncEndTimestamp = Date.now();
    await MediaProviderDatastore.updateMediaProviderByIdentifier(mediaProviderIdentifier, {
      sync_finished_at: mediaSyncEndTimestamp,
    });
    debug('finished sync for provider %s at %d', mediaProviderIdentifier, mediaSyncEndTimestamp);

    store.dispatch({
      type: MediaEnums.MediaLibraryActions.FinishSync,
      data: {
        mediaProviderIdentifier,
      },
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
      mediaArtistData = await MediaArtistDatastore.findMediaArtist({
        provider: mediaArtistInputData.provider,
        artist_name: mediaArtistInputData.artist_name,
      });
    }

    if (!mediaArtistData) {
      mediaArtistData = await MediaArtistDatastore.insertMediaArtist({
        provider: mediaArtistInputData.provider,
        provider_id: mediaArtistInputData.provider_id,
        artist_name: mediaArtistInputData.artist_name,
        artist_display_picture: await this.processPicture(mediaArtistInputData.artist_feature_picture),
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
      mediaTrackAlbumData = await MediaAlbumDatastore.findMediaAlbum({
        provider: mediaAlbumInputData.provider,
        album_name: mediaAlbumInputData.album_name,
      });
    }

    if (!mediaTrackAlbumData) {
      mediaTrackAlbumData = await MediaAlbumDatastore.insertMediaAlbum({
        provider: mediaAlbumInputData.provider,
        provider_id: mediaAlbumInputData.provider_id,
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
    }

    if (!mediaTrackData) {
      mediaTrackData = await MediaTrackDatastore.insertMediaTrack({
        provider: mediaTrackInputData.provider,
        provider_id: mediaTrackInputData.provider_id,
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

  async getMediaAlbumTracks(mediaAlbumId: string): Promise<IMediaTrack[]> {
    const mediaAlbumTrackDataList = await MediaTrackDatastore.findMediaTracks({
      track_album_id: mediaAlbumId,
    });

    const mediaAlbumTracks = await this.buildMediaTracks(mediaAlbumTrackDataList);
    return MediaUtils.sortMediaAlbumTracks(mediaAlbumTracks);
  }

  async getMediaAlbums(): Promise<IMediaAlbum[]> {
    const mediaAlbumDataList = await MediaAlbumDatastore.findMediaAlbums();

    const mediaAlbums = await Promise.all(mediaAlbumDataList.map(mediaAlbumData => this.buildMediaAlbum(mediaAlbumData)));
    return MediaUtils.sortMediaAlbums(mediaAlbums);
  }

  // load API

  loadMediaAlbums(): void {
    this
      .getMediaAlbums()
      .then((mediaAlbums) => {
        store.dispatch({
          type: MediaEnums.MediaLibraryActions.AddAlbums,
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

  private async buildMediaTrack(mediaTrackData: IMediaTrackData, loadMediaTrack = false): Promise<IMediaTrack> {
    const mediaTrack = _.assign({}, mediaTrackData, {
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

    const mediaAlbumBuilt = _.assign({}, mediaAlbumData, {
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
}

export default new MediaLibraryService();

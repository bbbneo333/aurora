import _ from 'lodash';

import { MediaLibraryActions, MediaTrackCoverPictureImageDataType } from '../enums';
import store from '../store';

import { DataStoreInputData } from '../modules/datastore';
import { IPCRenderer, IPCCommChannel } from '../modules/ipc';

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

import { MediaTrackService } from './media-track.service';
import { MediaArtistService } from './media-artist.service';
import { MediaAlbumService } from './media-album.service';

const debug = require('debug')('aurora:service:media_library');

export class MediaLibraryService {
  static readonly mediaPictureScaleWidth = 500;
  static readonly mediaPictureScaleHeight = 500;

  static async checkAndInsertMediaArtists(mediaArtistInputDataList: DataStoreInputData<IMediaArtistData>[]): Promise<IMediaArtist[]> {
    return Promise.all(mediaArtistInputDataList.map(mediaArtistInputData => this.checkAndInsertMediaArtist(mediaArtistInputData)));
  }

  static async checkAndInsertMediaArtist(mediaArtistInputData: DataStoreInputData<IMediaArtistData>): Promise<IMediaArtist> {
    if (_.isNil(mediaArtistInputData.provider_id)) {
      throw new Error('Provider id is required for checkAndInsertMediaArtist');
    }

    const mediaArtistData = await MediaArtistDatastore.upsertMediaArtist({
      provider: mediaArtistInputData.provider,
      provider_id: mediaArtistInputData.provider_id,
    }, {
      provider: mediaArtistInputData.provider,
      provider_id: mediaArtistInputData.provider_id,
      sync_timestamp: mediaArtistInputData.sync_timestamp,
      artist_name: mediaArtistInputData.artist_name,
      artist_feature_picture: await this.processPicture(mediaArtistInputData.artist_feature_picture),
      extra: mediaArtistInputData.extra,
    });

    return MediaArtistService.buildMediaArtist(mediaArtistData, true);
  }

  static async checkAndInsertMediaAlbum(mediaAlbumInputData: DataStoreInputData<IMediaAlbumData>): Promise<IMediaAlbum> {
    if (_.isNil(mediaAlbumInputData.provider_id)) {
      throw new Error('Provider id is required for checkAndInsertMediaAlbum');
    }

    const mediaTrackAlbumData = await MediaAlbumDatastore.upsertMediaAlbum({
      provider: mediaAlbumInputData.provider,
      provider_id: mediaAlbumInputData.provider_id,
    }, {
      provider: mediaAlbumInputData.provider,
      provider_id: mediaAlbumInputData.provider_id,
      sync_timestamp: mediaAlbumInputData.sync_timestamp,
      album_name: mediaAlbumInputData.album_name,
      album_artist_id: mediaAlbumInputData.album_artist_id,
      album_cover_picture: await this.processPicture(mediaAlbumInputData.album_cover_picture),
      extra: mediaAlbumInputData.extra,
    });

    return MediaAlbumService.buildMediaAlbum(mediaTrackAlbumData, true);
  }

  static async checkAndInsertMediaTrack(mediaTrackInputData: DataStoreInputData<IMediaTrackData>): Promise<IMediaTrack> {
    if (_.isNil(mediaTrackInputData.provider_id)) {
      throw new Error('Provider id is required for checkAndInsertMediaTrack');
    }

    const mediaTrackData = await MediaTrackDatastore.upsertMediaTrack({
      provider: mediaTrackInputData.provider,
      provider_id: mediaTrackInputData.provider_id,
    }, {
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

    return MediaTrackService.buildMediaTrack(mediaTrackData, true);
  }

  static async startMediaTrackSync(mediaProviderIdentifier: string): Promise<void> {
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

  static async finishMediaTrackSync(mediaProviderIdentifier: string): Promise<void> {
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

  private static async processPicture(mediaPicture?: IMediaPicture): Promise<IMediaPicture | undefined> {
    // this accepts a MediaPicture and returns a serializable instance of MediaPicture which can be stored and
    // further processed system-wide after deserializing
    if (!mediaPicture) {
      return undefined;
    }

    if (mediaPicture.image_data_type === MediaTrackCoverPictureImageDataType.Buffer) {
      let imageCachePath;

      try {
        imageCachePath = await IPCRenderer.sendAsyncMessage(IPCCommChannel.ImageScale, mediaPicture.image_data, {
          width: this.mediaPictureScaleWidth,
          height: this.mediaPictureScaleHeight,
        });
      } catch (error) {
        console.error('encountered error while processing image - %s', error);
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

  private static async deleteUnsyncMedia(mediaProviderIdentifier: string, mediaSyncStartTimestamp: number): Promise<void> {
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

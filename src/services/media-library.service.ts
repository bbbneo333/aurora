import * as _ from 'lodash';

import {MediaAlbumDatastore, MediaArtistDatastore, MediaTrackDatastore} from '../datastores';
import {MediaEnums} from '../enums';
import {DatastoreUtils} from '../utils';

import {
  IMediaAlbum,
  IMediaAlbumData,
  IMediaAlbumProviderData, IMediaArtist,
  IMediaArtistData,
  IMediaArtistProviderData,
  IMediaTrack,
  IMediaTrackData,
  IMediaTrackProviderData,
} from '../interfaces';

import MediaProviderService from './media-provider.service';
import store from '../store';

class MediaLibraryService {
  async insertMediaTrack(mediaProviderIdentifier: string, mediaTrackProviderData: IMediaTrackProviderData): Promise<IMediaTrack> {
    const mediaTrackData = await this.checkAndInsertMediaTrack(mediaProviderIdentifier, mediaTrackProviderData);
    const mediaTrack = await this.buildMediaTrack(mediaTrackData);

    // only adding to store if not already exists
    // TODO: This needs to be removed once views are requesting track list manually via getMediaTracks
    if (!store.getState()
      .mediaLibrary
      .mediaTracks
      .find(m => m.id === mediaTrack.id)) {
      store.dispatch({
        type: MediaEnums.MediaLibraryActions.AddTrack,
        data: {
          mediaTrack,
        },
      });
    }

    return mediaTrack;
  }

  async removeMediaTrack(mediaTrack: IMediaTrack): Promise<void> {
    const {mediaLibraryService} = MediaProviderService.getMediaProvider(mediaTrack.provider);

    const mediaTrackWasRemoved = await mediaLibraryService.removeMediaTrack(mediaTrack);
    if (!mediaTrackWasRemoved) {
      throw new Error(`MediaLibraryService encountered error at removeMediaTrack - Media track could not be removed for provider - ${mediaTrack.provider}, track id - ${mediaTrack.id}`);
    }

    store.dispatch({
      type: MediaEnums.MediaLibraryActions.RemoveTrack,
      data: {
        mediaTrackId: mediaTrack.id,
      },
    });
  }

  private async buildMediaTrack(mediaTrackData: IMediaTrackData): Promise<IMediaTrack> {
    return _.assign({}, mediaTrackData, {
      track_artists: await this.buildMediaArtists(mediaTrackData.track_artist_ids),
      track_album: await this.buildMediaAlbum(mediaTrackData.track_album_id),
    });
  }

  private async buildMediaAlbum(mediaAlbumId: string): Promise<IMediaAlbum> {
    const mediaAlbumData = await MediaAlbumDatastore.findMediaAlbumById(mediaAlbumId);
    if (!mediaAlbumData) {
      throw new Error(`MediaLibraryService encountered error at buildMediaAlbum - Could not find album - ${mediaAlbumId}`);
    }

    return _.assign({}, mediaAlbumData, {
      album_artist: await this.buildMediaArtist(mediaAlbumData.album_artist_id),
    });
  }

  private buildMediaArtists(mediaArtistIds: string[]): Promise<IMediaArtist[]> {
    return Promise.all(mediaArtistIds.map(mediaArtistId => this.buildMediaArtist(mediaArtistId)));
  }

  private async buildMediaArtist(mediaArtistId: string): Promise<IMediaArtist> {
    const mediaArtistData = await MediaArtistDatastore.findMediaArtistById(mediaArtistId);
    if (!mediaArtistData) {
      throw new Error(`MediaLibraryService encountered error at buildMediaArtist - Could not find artist - ${mediaArtistId}`);
    }

    // no further processing required, conclude right away
    return mediaArtistData;
  }

  private async checkAndInsertMediaArtists(mediaProviderIdentifier: string, mediaArtistProviderDataList: IMediaArtistProviderData[]): Promise<IMediaArtistData[]> {
    return Promise.all(mediaArtistProviderDataList.map(mediaArtistProviderData => this.checkAndInsertMediaArtist(mediaProviderIdentifier, mediaArtistProviderData)));
  }

  private async checkAndInsertMediaArtist(mediaProviderIdentifier: string, mediaArtistProviderData: IMediaArtistProviderData): Promise<IMediaArtistData> {
    let mediaArtistData;
    if (!_.isNil(mediaArtistProviderData.provider_id)) {
      mediaArtistData = await MediaArtistDatastore.findMediaArtistByProvider(mediaProviderIdentifier, mediaArtistProviderData.provider_id);
    } else {
      mediaArtistData = await MediaArtistDatastore.findMediaArtistByName(mediaProviderIdentifier, mediaArtistProviderData.artist_name);
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

  private async checkAndInsertMediaAlbum(mediaProviderIdentifier: string, mediaAlbumProviderData: IMediaAlbumProviderData): Promise<IMediaAlbumData> {
    let mediaTrackAlbum;
    if (!_.isNil(mediaAlbumProviderData.provider_id)) {
      mediaTrackAlbum = await MediaAlbumDatastore.findMediaAlbumByProvider(mediaProviderIdentifier, mediaAlbumProviderData.provider_id);
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
    let mediaTrackData;
    if (!_.isNil(mediaTrackProviderData.provider_id)) {
      mediaTrackData = await MediaTrackDatastore.findMediaTrackByProvider(mediaProviderIdentifier, mediaTrackProviderData.provider_id);
    }
    if (mediaTrackData) {
      return mediaTrackData;
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
      extra: mediaTrackProviderData.extra,
    });
  }
}

export default new MediaLibraryService();

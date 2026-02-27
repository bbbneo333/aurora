import _ from 'lodash';

import { MediaTrackDatastore } from '../datastores';
import { IMediaTrack, IMediaTrackData } from '../interfaces';
import { MediaLibraryActions } from '../enums';
import { MediaUtils } from '../utils';
import { DataStoreFilterData, DataStoreUpdateData } from '../modules/datastore';
import store from '../store';

import { MediaArtistService } from './media-artist.service';
import { MediaAlbumService } from './media-album.service';

export class MediaTrackService {
  static async searchTracksByName(query: string): Promise<IMediaTrack[]> {
    const tracks = await MediaTrackDatastore.findMediaTracks({
      track_name: {
        $regex: new RegExp(query, 'i'),
      },
    });

    return this.buildMediaTracks(tracks);
  }

  static async getMediaTrack(mediaTrackId: string): Promise<IMediaTrack | undefined> {
    const mediaTrackData = await MediaTrackDatastore.findMediaTrack({
      id: mediaTrackId,
    });

    return mediaTrackData ? this.buildMediaTrack(mediaTrackData) : undefined;
  }

  static async getMediaTrackForProvider(provider: string, provider_id: string): Promise<IMediaTrack | undefined> {
    const mediaTrackData = await MediaTrackDatastore.findMediaTrack({
      provider,
      provider_id,
    });

    return mediaTrackData ? this.buildMediaTrack(mediaTrackData) : undefined;
  }

  static async getMediaAlbumTracks(mediaAlbumId: string): Promise<IMediaTrack[]> {
    const mediaAlbumTrackDataList = await MediaTrackDatastore.findMediaTracks({
      track_album_id: mediaAlbumId,
    });

    const mediaAlbumTracks = await this.buildMediaTracks(mediaAlbumTrackDataList);
    return MediaUtils.sortMediaAlbumTracks(mediaAlbumTracks);
  }

  static async getMediaArtistTracks(mediaArtistId: string): Promise<IMediaTrack[]> {
    const mediaTrackDataList = await MediaTrackDatastore.findMediaTracks({
      track_artist_ids: [mediaArtistId],
    });

    const mediaTracks = await this.buildMediaTracks(mediaTrackDataList);
    return MediaUtils.sortMediaArtistTracks(mediaTracks);
  }

  static async updateMediaTrack(mediaTrackFilterData: DataStoreFilterData<IMediaTrackData>, mediaTrackUpdateData: DataStoreUpdateData<IMediaTrackData>): Promise<IMediaTrack | undefined> {
    const mediaTrackData = await MediaTrackDatastore.updateMediaTrack(mediaTrackFilterData, mediaTrackUpdateData);
    if (!mediaTrackData) {
      return undefined;
    }

    return this.buildMediaTrack(mediaTrackData, true);
  }

  static loadMediaAlbumTracks(mediaAlbumId: string): void {
    this
      .getMediaAlbumTracks(mediaAlbumId)
      .then(async (mediaAlbumTracks) => {
        store.dispatch({
          type: MediaLibraryActions.SetAlbum,
          data: {
            mediaAlbum: await MediaAlbumService.getMediaAlbum(mediaAlbumId),
            mediaAlbumTracks,
          },
        });
      });
  }

  static async buildMediaTrack(mediaTrackData: IMediaTrackData, loadMediaTrack = false): Promise<IMediaTrack> {
    const mediaTrack = _.assign({}, mediaTrackData, {
      track_artists: await MediaArtistService.buildMediaArtists(mediaTrackData.track_artist_ids, loadMediaTrack),
      track_album: await MediaAlbumService.buildMediaAlbum(mediaTrackData.track_album_id, loadMediaTrack),
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

  static async buildMediaTracks(mediaTrackDataList: IMediaTrackData[], loadMediaTracks = false): Promise<IMediaTrack[]> {
    return Promise.all(mediaTrackDataList.map(mediaTrackData => this.buildMediaTrack(mediaTrackData, loadMediaTracks)));
  }
}

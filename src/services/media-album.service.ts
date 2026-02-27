import _ from 'lodash';

import { MediaAlbumDatastore } from '../datastores';
import { MediaLibraryActions } from '../enums';
import { IMediaAlbum, IMediaAlbumData } from '../interfaces';
import { MediaUtils } from '../utils';
import store from '../store';

import { MediaArtistService } from './media-artist.service';
import { DataStoreFilterData, DataStoreUpdateData } from '../modules/datastore';

export class MediaAlbumService {
  static async searchAlbumsByName(query: string): Promise<IMediaAlbum[]> {
    const albums = await MediaAlbumDatastore.findMediaAlbums({
      album_name: {
        $regex: new RegExp(query, 'i'),
      },
    });

    return this.buildMediaAlbums(albums);
  }

  static async getMediaAlbum(albumId: string): Promise<IMediaAlbum | undefined> {
    const albumData = await MediaAlbumDatastore.findMediaAlbumById(albumId);
    return albumData ? this.buildMediaAlbum(albumData) : undefined;
  }

  static async getMediaAlbums(): Promise<IMediaAlbum[]> {
    const mediaAlbumDataList = await MediaAlbumDatastore.findMediaAlbums();

    const mediaAlbums = await Promise.all(mediaAlbumDataList.map(mediaAlbumData => this.buildMediaAlbum(mediaAlbumData)));
    return MediaUtils.sortMediaAlbums(mediaAlbums);
  }

  static async getMediaArtistAlbums(mediaArtistId: string): Promise<IMediaAlbum[]> {
    const mediaAlbumDataList = await MediaAlbumDatastore.findMediaAlbums({
      album_artist_id: mediaArtistId,
    });

    const mediaAlbums = await Promise.all(mediaAlbumDataList.map(mediaAlbumData => this.buildMediaAlbum(mediaAlbumData)));
    return MediaUtils.sortMediaAlbums(mediaAlbums);
  }

  static async updateMediaAlbum(mediaAlbumFilterData: DataStoreFilterData<IMediaAlbumData>, mediaAlbumUpdateData: DataStoreUpdateData<IMediaAlbumData>): Promise<IMediaAlbum | undefined> {
    const mediaAlbumData = await MediaAlbumDatastore.updateMediaAlbum(mediaAlbumFilterData, mediaAlbumUpdateData);
    if (!mediaAlbumData) {
      return undefined;
    }

    return this.buildMediaAlbum(mediaAlbumData, true);
  }

  static loadMediaAlbums(): void {
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

  static loadMediaArtistAlbums(mediaArtistId: string): void {
    this
      .getMediaArtistAlbums(mediaArtistId)
      .then(async (mediaArtistAlbums) => {
        store.dispatch({
          type: MediaLibraryActions.SetArtist,
          data: {
            mediaArtist: await MediaArtistService.getMediaArtist(mediaArtistId),
            mediaArtistAlbums,
          },
        });
      });
  }

  static unloadMediaAlbum(): void {
    store.dispatch({
      type: MediaLibraryActions.SetAlbum,
      data: {
        mediaAlbum: undefined,
        mediaAlbumTracks: undefined,
      },
    });
  }

  static async buildMediaAlbum(mediaAlbum: string | IMediaAlbumData, loadMediaAlbum = false): Promise<IMediaAlbum> {
    let mediaAlbumData;
    if (typeof mediaAlbum === 'string') {
      mediaAlbumData = await MediaAlbumDatastore.findMediaAlbumById(mediaAlbum);

      if (!mediaAlbumData) {
        throw new Error(`MediaLibraryService encountered error at buildMediaAlbum - Could not find album - ${mediaAlbum}`);
      }
    } else {
      mediaAlbumData = mediaAlbum;
    }

    const mediaAlbumArtist = await MediaArtistService.getMediaArtist(mediaAlbumData.album_artist_id);
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

  static async buildMediaAlbums(mediaAlbums: string[] | IMediaAlbumData[], loadMediaAlbums = false): Promise<IMediaAlbum[]> {
    return Promise.all(mediaAlbums.map((mediaAlbum: any) => this.buildMediaAlbum(mediaAlbum, loadMediaAlbums)));
  }
}

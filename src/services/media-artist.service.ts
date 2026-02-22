import { MediaArtistDatastore } from '../datastores';
import { MediaLibraryActions } from '../enums';
import { IMediaArtist, IMediaArtistData } from '../interfaces';
import { MediaUtils } from '../utils';
import { DataStoreFilterData, DataStoreUpdateData } from '../modules/datastore';
import store from '../store';

export class MediaArtistService {
  static async searchArtistsByName(query: string): Promise<IMediaArtist[]> {
    const artists = await MediaArtistDatastore.findMediaArtists({
      artist_name: {
        $regex: new RegExp(query, 'i'),
      },
    });

    return this.buildMediaArtists(artists);
  }

  static async getMediaArtist(artistId: string): Promise<IMediaArtist | undefined> {
    const artistData = await MediaArtistDatastore.findMediaArtistById(artistId);
    return artistData ? this.buildMediaArtist(artistData) : undefined;
  }

  static async getMediaArtists(): Promise<IMediaArtist[]> {
    const mediaArtistDataList = await MediaArtistDatastore.findMediaArtists();

    const mediaArtists = await Promise.all(mediaArtistDataList.map(mediaArtistData => this.buildMediaArtist(mediaArtistData)));
    return MediaUtils.sortMediaArtists(mediaArtists);
  }

  static async updateMediaArtists(mediaArtistFilterData: DataStoreFilterData<IMediaArtistData>, mediaArtistUpdateData: DataStoreUpdateData<IMediaArtistData>): Promise<IMediaArtist[] | undefined> {
    const mediaAlbumDataList = await MediaArtistDatastore.updateArtists(mediaArtistFilterData, mediaArtistUpdateData);
    return this.buildMediaArtists(mediaAlbumDataList, true);
  }

  static loadMediaArtists(): void {
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

  static unloadMediaArtist(): void {
    store.dispatch({
      type: MediaLibraryActions.SetArtist,
      data: {
        mediaArtist: undefined,
        mediaArtistAlbums: undefined,
      },
    });
  }

  static async buildMediaArtist(mediaArtist: string | IMediaArtistData, loadMediaArtist = false): Promise<IMediaArtist> {
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

  static async buildMediaArtists(mediaArtists: string[] | IMediaArtistData[], loadMediaArtists = false): Promise<IMediaArtist[]> {
    return Promise.all(mediaArtists.map((mediaArtist: any) => this.buildMediaArtist(mediaArtist, loadMediaArtists)));
  }
}

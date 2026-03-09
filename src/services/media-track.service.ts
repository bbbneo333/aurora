import _ from 'lodash';

import { MediaArtistDatastore, MediaTrackDatastore } from '../datastores';
import { IMediaArtist, IMediaTrack, IMediaTrackData } from '../interfaces';
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

  static async searchTracksByQuery(query: string, limit = 20): Promise<IMediaTrack[]> {
    const normalizedQuery = this.normalizeSearchValue(query);
    if (!normalizedQuery) {
      return [];
    }

    const queryTerms = normalizedQuery
      .split(/\s+/)
      .map(value => value.trim())
      .filter(Boolean);

    if (!queryTerms.length) {
      return [];
    }

    const mediaTrackDataList = await MediaTrackDatastore.findMediaTracks();
    const mediaTracks = await this.buildMediaTracks(mediaTrackDataList);

    const scoredTracks = mediaTracks
      .map((track) => {
        const score = this.getTrackSearchScore(track, normalizedQuery, queryTerms);
        return {
          score,
          track,
        };
      })
      .filter(item => item.score > 0);

    return _.orderBy(
      scoredTracks,
      [
        'score',
        item => this.normalizeSearchValue(item.track.track_name),
      ],
      ['desc', 'asc'],
    )
      .slice(0, limit)
      .map(item => item.track);
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
    const {
      mediaTrackArtists,
      mediaTrackArtistIds,
    } = await this.buildMediaTrackArtists(mediaTrackData);
    const mediaTrack = _.assign({}, mediaTrackData, {
      track_artist_ids: mediaTrackArtistIds,
      track_artists: mediaTrackArtists,
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

  private static normalizeSearchValue(value: string): string {
    return String(value || '').toLowerCase().trim();
  }

  private static getTrackSearchScore(track: IMediaTrack, normalizedQuery: string, queryTerms: string[]): number {
    const trackName = this.normalizeSearchValue(track.track_name);
    const albumName = this.normalizeSearchValue(track.track_album?.album_name || '');
    const artistName = this.normalizeSearchValue(track.track_artists.map(artist => artist.artist_name).join(' '));
    const combined = `${trackName} ${albumName} ${artistName}`.trim();

    let score = 0;
    if (combined.includes(normalizedQuery)) {
      score += 140;
    }
    if (trackName.includes(normalizedQuery)) {
      score += 180;
    }
    if (artistName.includes(normalizedQuery)) {
      score += 110;
    }
    if (albumName.includes(normalizedQuery)) {
      score += 90;
    }

    queryTerms.forEach((term) => {
      if (trackName === term) {
        score += 140;
      } else if (trackName.startsWith(term)) {
        score += 95;
      } else if (trackName.includes(term)) {
        score += 70;
      }

      if (artistName === term) {
        score += 90;
      } else if (artistName.startsWith(term)) {
        score += 65;
      } else if (artistName.includes(term)) {
        score += 55;
      }

      if (albumName === term) {
        score += 75;
      } else if (albumName.startsWith(term)) {
        score += 50;
      } else if (albumName.includes(term)) {
        score += 40;
      }
    });

    return score;
  }

  private static async buildMediaTrackArtists(mediaTrackData: IMediaTrackData): Promise<{ mediaTrackArtists: IMediaArtist[]; mediaTrackArtistIds: string[] }> {
    const mediaTrackArtists: IMediaArtist[] = [];
    const mediaTrackArtistIds: string[] = [];

    await Promise.all(mediaTrackData.track_artist_ids.map(async (mediaTrackArtistId) => {
      let mediaTrackArtist = await MediaArtistService.getMediaArtist(mediaTrackArtistId);
      if (!mediaTrackArtist) {
        const recoveredArtistProviderId = `recovered-artist:${mediaTrackData.provider}:${mediaTrackArtistId}`;
        const recoveredArtistData = await MediaArtistDatastore.upsertMediaArtist({
          provider: mediaTrackData.provider,
          provider_id: recoveredArtistProviderId,
        }, {
          provider: mediaTrackData.provider,
          provider_id: recoveredArtistProviderId,
          artist_name: 'Unknown Artist',
          sync_timestamp: mediaTrackData.sync_timestamp,
        });
        mediaTrackArtist = await MediaArtistService.getMediaArtist(recoveredArtistData.id);
      }

      if (mediaTrackArtist) {
        mediaTrackArtists.push(mediaTrackArtist);
        mediaTrackArtistIds.push(mediaTrackArtist.id);
      }
    }));

    if (mediaTrackArtists.length === 0) {
      throw new Error(`MediaTrackService encountered error at buildMediaTrackArtists - Could not resolve any artists for track - ${mediaTrackData.id}`);
    }

    const mediaTrackArtistIdsUnique = _.uniq(mediaTrackArtistIds);
    if (!_.isEqual(mediaTrackArtistIdsUnique, mediaTrackData.track_artist_ids)) {
      await MediaTrackDatastore.updateMediaTrack({
        id: mediaTrackData.id,
      }, {
        track_artist_ids: mediaTrackArtistIdsUnique,
      });
    }

    return {
      mediaTrackArtists,
      mediaTrackArtistIds: mediaTrackArtistIdsUnique,
    };
  }
}

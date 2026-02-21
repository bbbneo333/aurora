import {
  IMediaAlbum,
  IMediaArtist,
  IMediaCollectionItem,
  IMediaCollectionSearchResults,
  IMediaPlaylist,
  IMediaTrack,
} from '../interfaces';

import { Icons, Routes } from '../constants';
import { MediaCollectionItemType } from '../enums';
import { StringUtils } from '../utils';

import { I18nService } from './i18n.service';
import { MediaAlbumService } from './media-album.service';
import { MediaArtistService } from './media-artist.service';
import { MediaTrackService } from './media-track.service';
import { MediaLikedTrackService } from './media-liked-track.service';
import { MediaPlaylistService } from './media-playlist.service';

export class MediaCollectionService {
  static async searchCollection(query: string): Promise<IMediaCollectionSearchResults> {
    return {
      tracks: await MediaTrackService.searchTracksByName(query),
      albums: await MediaAlbumService.searchAlbumsByName(query),
      artists: await MediaArtistService.searchArtistsByName(query),
      playlists: await MediaPlaylistService.searchPlaylistsByName(query),
    };
  }

  static async getMediaCollectionTracks(mediaCollectionItem: IMediaCollectionItem): Promise<IMediaTrack[]> {
    switch (mediaCollectionItem.type) {
      case MediaCollectionItemType.Album: {
        return MediaTrackService.getMediaAlbumTracks(mediaCollectionItem.id);
      }
      case MediaCollectionItemType.Artist: {
        return MediaTrackService.getMediaArtistTracks(mediaCollectionItem.id);
      }
      case MediaCollectionItemType.Playlist: {
        return MediaPlaylistService.resolveMediaPlaylistTracks(mediaCollectionItem.id);
      }
      case MediaCollectionItemType.LikedTracks: {
        return MediaLikedTrackService.resolveLikedTracks();
      }
      default:
        throw new Error(`Unsupported media collection type - ${mediaCollectionItem.type}`);
    }
  }

  static getMediaItemFromAlbum(mediaAlbum: IMediaAlbum): IMediaCollectionItem {
    return {
      id: mediaAlbum.id,
      type: MediaCollectionItemType.Album,
      name: mediaAlbum.album_name,
      picture: mediaAlbum.album_cover_picture,
    };
  }

  static getMediaItemFromArtist(mediaArtist: IMediaArtist): IMediaCollectionItem {
    return {
      id: mediaArtist.id,
      name: mediaArtist.artist_name,
      type: MediaCollectionItemType.Artist,
      picture: mediaArtist.artist_feature_picture,
    };
  }

  static getMediaItemFromPlaylist(mediaPlaylist: IMediaPlaylist): IMediaCollectionItem {
    return {
      id: mediaPlaylist.id,
      name: mediaPlaylist.name,
      type: MediaCollectionItemType.Playlist,
      picture: mediaPlaylist.cover_picture,
    };
  }

  static getMediaItemForLikedTracks() {
    return {
      id: 'liked-tracks',
      name: I18nService.getString('label_liked_tracks_collection_name'),
      type: MediaCollectionItemType.LikedTracks,
      picture: undefined,
    };
  }

  static getItemCoverPlaceholderIcon(mediaCollectionItem: IMediaCollectionItem): string {
    switch (mediaCollectionItem.type) {
      case MediaCollectionItemType.Artist:
        return Icons.ArtistPlaceholder;
      case MediaCollectionItemType.Album:
        return Icons.AlbumPlaceholder;
      case MediaCollectionItemType.Playlist:
        return Icons.PlaylistPlaceholder;
      case MediaCollectionItemType.LikedTracks:
        return Icons.MediaLike;
      default:
        return Icons.AlbumPlaceholder;
    }
  }

  static getItemRouterLink(mediaCollectionItem: IMediaCollectionItem): string {
    switch (mediaCollectionItem.type) {
      case MediaCollectionItemType.Album:
        return StringUtils.buildRoute(Routes.LibraryAlbum, {
          albumId: mediaCollectionItem.id,
        });
      case MediaCollectionItemType.Artist:
        return StringUtils.buildRoute(Routes.LibraryArtist, {
          artistId: mediaCollectionItem.id,
        });
      case MediaCollectionItemType.Playlist:
        return StringUtils.buildRoute(Routes.LibraryPlaylist, {
          playlistId: mediaCollectionItem.id,
        });
      case MediaCollectionItemType.LikedTracks:
        return Routes.LibraryLikedTracks;
      default:
        throw new Error(`Unsupported media collection type - ${mediaCollectionItem.type}`);
    }
  }

  static getItemSubtitle(mediaCollectionItem: IMediaCollectionItem): string {
    switch (mediaCollectionItem.type) {
      case MediaCollectionItemType.Artist:
        return I18nService.getString('label_artist_header');
      case MediaCollectionItemType.Album:
        return I18nService.getString('label_album_header');
      case MediaCollectionItemType.Playlist:
      case MediaCollectionItemType.LikedTracks:
        return I18nService.getString('label_playlist_header');
      default:
        throw new Error(`Unsupported media collection type - ${mediaCollectionItem.type}`);
    }
  }

  static async getMediaItem(id: string, type: MediaCollectionItemType): Promise<IMediaCollectionItem | undefined> {
    switch (type) {
      case MediaCollectionItemType.Album: {
        const album = await MediaAlbumService.getMediaAlbum(id);
        return album ? this.getMediaItemFromAlbum(album) : undefined;
      }
      case MediaCollectionItemType.Artist: {
        const artist = await MediaArtistService.getMediaArtist(id);
        return artist ? this.getMediaItemFromArtist(artist) : undefined;
      }
      case MediaCollectionItemType.Playlist: {
        const playlist = await MediaPlaylistService.getMediaPlaylist(id);
        return playlist ? this.getMediaItemFromPlaylist(playlist) : undefined;
      }
      case MediaCollectionItemType.LikedTracks: {
        return this.getMediaItemForLikedTracks();
      }
      default:
        throw new Error(`Unsupported media collection type - ${type}`);
    }
  }
}

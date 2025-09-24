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

import MediaLibraryService from './media-library.service';
import MediaLikedTrackService from './media-liked-track.service';
import MediaPlaylistService from './media-playlist.service';
import I18nService from './i18n.service';

class MediaCollectionService {
  async searchCollection(query: string): Promise<IMediaCollectionSearchResults> {
    return {
      tracks: await MediaLibraryService.searchTracksByName(query),
      albums: await MediaLibraryService.searchAlbumsByName(query),
      artists: await MediaLibraryService.searchArtistsByName(query),
      playlists: await MediaPlaylistService.searchPlaylistsByName(query),
    };
  }

  async getMediaCollectionTracks(mediaCollectionItem: IMediaCollectionItem): Promise<IMediaTrack[]> {
    switch (mediaCollectionItem.type) {
      case MediaCollectionItemType.Album: {
        return MediaLibraryService.getMediaAlbumTracks(mediaCollectionItem.id);
      }
      case MediaCollectionItemType.Artist: {
        return MediaLibraryService.getMediaArtistTracks(mediaCollectionItem.id);
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

  getMediaItemFromAlbum(mediaAlbum: IMediaAlbum): IMediaCollectionItem {
    return {
      id: mediaAlbum.id,
      type: MediaCollectionItemType.Album,
      name: mediaAlbum.album_name,
      picture: mediaAlbum.album_cover_picture,
    };
  }

  getMediaItemFromArtist(mediaArtist: IMediaArtist): IMediaCollectionItem {
    return {
      id: mediaArtist.id,
      name: mediaArtist.artist_name,
      type: MediaCollectionItemType.Artist,
      picture: mediaArtist.artist_feature_picture,
    };
  }

  getMediaItemFromPlaylist(mediaPlaylist: IMediaPlaylist): IMediaCollectionItem {
    return {
      id: mediaPlaylist.id,
      name: mediaPlaylist.name,
      type: MediaCollectionItemType.Playlist,
      picture: mediaPlaylist.cover_picture,
    };
  }

  getMediaItemForLikedTracks() {
    return {
      id: 'liked-tracks',
      name: I18nService.getString('label_liked_tracks_collection_name'),
      type: MediaCollectionItemType.LikedTracks,
      picture: undefined,
    };
  }

  getItemCoverPlaceholderIcon(mediaCollectionItem: IMediaCollectionItem): string {
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

  getItemRouterLink(mediaCollectionItem: IMediaCollectionItem): string {
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

  getItemSubtitle(mediaCollectionItem: IMediaCollectionItem): string {
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

  async getMediaItem(id: string, type: MediaCollectionItemType): Promise<IMediaCollectionItem | undefined> {
    switch (type) {
      case MediaCollectionItemType.Album: {
        const album = await MediaLibraryService.getMediaAlbum(id);
        return album ? this.getMediaItemFromAlbum(album) : undefined;
      }
      case MediaCollectionItemType.Artist: {
        const artist = await MediaLibraryService.getMediaArtist(id);
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

export default new MediaCollectionService();

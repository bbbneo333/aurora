import {
  IMediaAlbum,
  IMediaArtist,
  IMediaCollectionItem,
  IMediaPlaylist,
  IMediaTrack,
} from '../interfaces';

import { Icons } from '../constants';
import { MediaCollectionItemType } from '../enums';

import MediaLibraryService from './media-library.service';
import MediaLikedTrackService from './media-liked-track.service';
import I18nService from './i18n.service';

class MediaCollectionService {
  async getMediaCollectionTracks(mediaCollectionItem: IMediaCollectionItem): Promise<IMediaTrack[]> {
    switch (mediaCollectionItem.type) {
      case MediaCollectionItemType.Album: {
        return MediaLibraryService.getMediaAlbumTracks(mediaCollectionItem.id);
      }
      case MediaCollectionItemType.Artist: {
        return MediaLibraryService.getMediaArtistTracks(mediaCollectionItem.id);
      }
      case MediaCollectionItemType.Playlist: {
        return MediaLibraryService.getMediaPlaylistTracks(mediaCollectionItem.id);
      }
      case MediaCollectionItemType.LikedTracks: {
        return MediaLikedTrackService.getLikedTracks();
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

  getCoverPlaceholderIcon(mediaCollectionItem: IMediaCollectionItem): string {
    switch (mediaCollectionItem.type) {
      case MediaCollectionItemType.LikedTracks:
        return Icons.MediaLike;
      default:
        return Icons.AlbumPlaceholder;
    }
  }
}

export default new MediaCollectionService();

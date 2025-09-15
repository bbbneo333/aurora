import { IMediaCollectionItem, IMediaTrack } from '../interfaces';
import { MediaCollectionItemType } from '../enums';

import MediaLibraryService from './media-library.service';
import MediaLibraryLikedTrackService from './media-library-liked-track.service';

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
        return MediaLibraryLikedTrackService.getLikedTracks();
      }
      default:
        throw new Error(`Unsupported media collection type - ${mediaCollectionItem.type}`);
    }
  }
}

export default new MediaCollectionService();

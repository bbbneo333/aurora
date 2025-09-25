import { omit, keyBy } from 'lodash';

import { MediaLibraryActions } from '../enums';
import { ArrayUtils, MediaUtils } from '../utils';

import {
  IMediaAlbum,
  IMediaArtist,
  IMediaLikedTrack,
  IMediaPinnedItem,
  IMediaPlaylist,
  IMediaTrack,
} from '../interfaces';

export type MediaLibraryState = {
  mediaAlbums: IMediaAlbum[];
  mediaArtists: IMediaArtist[];
  mediaSelectedAlbum?: IMediaAlbum;
  mediaSelectedAlbumTracks?: IMediaTrack[];
  mediaSelectedArtist?: IMediaArtist;
  mediaSelectedArtistAlbums?: IMediaAlbum[];
  mediaIsSyncing: boolean;
  mediaPlaylists: IMediaPlaylist[];
  mediaSelectedPlaylist?: IMediaPlaylist;
  mediaLikedTracksRecord: Record<string, IMediaLikedTrack>;
  mediaPinnedItemsRecord: Record<string, IMediaPinnedItem>;
};

export type MediaLibraryStateAction = {
  type: MediaLibraryActions,
  data?: any,
};

const mediaLibraryInitialState: MediaLibraryState = {
  mediaAlbums: [],
  mediaArtists: [],
  mediaIsSyncing: false,
  mediaPlaylists: [],
  mediaLikedTracksRecord: {},
  mediaPinnedItemsRecord: {},
};

export default (state: MediaLibraryState = mediaLibraryInitialState, action: MediaLibraryStateAction): MediaLibraryState => {
  switch (action.type) {
    case MediaLibraryActions.Initialize: {
      // data.mediaProviderIdentifier
      // TODO: To be implemented

      return state;
    }
    case MediaLibraryActions.StartSync: {
      // data.mediaProviderIdentifier

      return {
        ...state,
        mediaIsSyncing: true,
      };
    }
    case MediaLibraryActions.FinishSync: {
      // data.mediaProviderIdentifier
      // data.mediaSyncStartTimestamp
      const { mediaSyncStartTimestamp } = action.data;
      let {
        mediaSelectedAlbumTracks = [],
        mediaAlbums,
        mediaArtists,
        mediaSelectedArtistAlbums = [],
        mediaSelectedArtist,
        mediaSelectedAlbum,
      } = state;

      if (!state.mediaIsSyncing) {
        throw new Error(`MediaLibraryReducer encountered error at StopSync - Sync not started yet - ${action.data.mediaProviderIdentifier}`);
      }

      // remove unsync media - tracks, albums and artists
      // media synchronized before the start of this sync will be removed
      // in order for this to work, make sure media in state is updated with correct timestamp during sync
      mediaSelectedAlbumTracks = mediaSelectedAlbumTracks.filter(mediaTrack => mediaTrack.sync_timestamp > mediaSyncStartTimestamp);
      mediaAlbums = mediaAlbums.filter(mediaAlbum => mediaAlbum.sync_timestamp > mediaSyncStartTimestamp);
      mediaArtists = mediaArtists.filter(mediaArtist => mediaArtist.sync_timestamp > mediaSyncStartTimestamp);
      mediaSelectedArtistAlbums = mediaSelectedArtistAlbums.filter(mediaAlbum => mediaAlbum.sync_timestamp > mediaSyncStartTimestamp);
      mediaSelectedArtist = mediaSelectedArtist && mediaSelectedArtist.sync_timestamp > mediaSyncStartTimestamp ? mediaSelectedArtist : undefined;
      mediaSelectedAlbum = mediaSelectedAlbum && mediaSelectedAlbum.sync_timestamp > mediaSyncStartTimestamp ? mediaSelectedAlbum : undefined;

      return {
        ...state,
        mediaIsSyncing: false,
        mediaSelectedAlbumTracks,
        mediaAlbums,
        mediaArtists,
        mediaSelectedArtistAlbums,
        mediaSelectedArtist,
        mediaSelectedAlbum,
      };
    }
    case MediaLibraryActions.AddTrack: {
      // data.mediaTrack: MediaTrack - track which needs to be added
      const { mediaTrack } = action.data;
      const { mediaSelectedAlbum } = state;
      const { mediaSelectedAlbumTracks = [] } = state;

      // location #1 - mediaSelectedAlbumTracks (if selected album was found)
      if (mediaSelectedAlbum && mediaSelectedAlbum.id === mediaTrack.track_album.id) {
        const mediaTrackIdx = mediaSelectedAlbumTracks.findIndex(mediaAlbumTrack => mediaAlbumTrack.id === mediaTrack.id);

        if (mediaTrackIdx === -1) {
          ArrayUtils.updateSortedArray<IMediaTrack>(mediaSelectedAlbumTracks, mediaTrack, MediaUtils.mediaTrackComparator);
        } else {
          mediaSelectedAlbumTracks[mediaTrackIdx] = mediaTrack;
        }
      }

      return {
        ...state,
        mediaSelectedAlbumTracks,
      };
    }
    case MediaLibraryActions.AddAlbum: {
      // data.mediaAlbum: MediaAlbum - album which needs to be added
      const { mediaAlbum } = action.data;
      const { mediaAlbums, mediaSelectedArtist, mediaSelectedArtistAlbums = [] } = state;
      let { mediaSelectedAlbum } = state;

      const mediaAlbumIdx = mediaAlbums.findIndex(exMediaAlbum => exMediaAlbum.id === mediaAlbum.id);
      if (mediaAlbumIdx === -1) {
        ArrayUtils.updateSortedArray<IMediaAlbum>(mediaAlbums, mediaAlbum, MediaUtils.mediaAlbumComparator);
      } else {
        mediaAlbums[mediaAlbumIdx] = mediaAlbum;
      }

      const mediaAlbumSelectedIdx = mediaSelectedArtistAlbums.findIndex(exMediaAlbum => exMediaAlbum.id === mediaAlbum.id);
      if (mediaSelectedArtist?.id === mediaAlbum.album_artist_id) {
        if (mediaAlbumSelectedIdx === -1) {
          ArrayUtils.updateSortedArray<IMediaAlbum>(mediaSelectedArtistAlbums, mediaAlbum, MediaUtils.mediaAlbumComparator);
        } else {
          mediaSelectedArtistAlbums[mediaAlbumSelectedIdx] = mediaAlbum;
        }
      }

      if (mediaSelectedAlbum?.id === mediaAlbum.id) {
        mediaSelectedAlbum = mediaAlbum;
      }

      return {
        ...state,
        mediaAlbums,
        mediaSelectedArtistAlbums,
        mediaSelectedAlbum,
      };
    }
    case MediaLibraryActions.SetAlbums: {
      // data.mediaAlbums: MediaAlbum[] - albums which are needed to be added
      const { mediaAlbums } = action.data;

      return {
        ...state,
        mediaAlbums: MediaUtils.sortMediaAlbums(mediaAlbums),
      };
    }
    case MediaLibraryActions.SetAlbum: {
      // data.mediaAlbum: MediaAlbum - album which needs to be loaded
      // data.mediaAlbumTracks: MediaTrack[] - album tracks which can be loaded
      const {
        mediaAlbum,
        mediaAlbumTracks,
      } = action.data;

      return {
        ...state,
        mediaSelectedAlbum: mediaAlbum,
        mediaSelectedAlbumTracks: mediaAlbumTracks,
      };
    }
    case MediaLibraryActions.AddArtist: {
      // data.mediaArtist: MediaArtist - artist which needs to be added
      const { mediaArtist } = action.data;
      const { mediaArtists } = state;
      let { mediaSelectedArtist } = state;

      const mediaArtistIdx = mediaArtists.findIndex(exMediaArtist => exMediaArtist.id === mediaArtist.id);
      if (mediaArtistIdx === -1) {
        ArrayUtils.updateSortedArray<IMediaArtist>(mediaArtists, mediaArtist, MediaUtils.mediaArtistComparator);
      } else {
        mediaArtists[mediaArtistIdx] = mediaArtist;
      }

      if (mediaSelectedArtist?.id === mediaArtist.id) {
        mediaSelectedArtist = mediaArtist;
      }

      return {
        ...state,
        mediaArtists,
        mediaSelectedArtist,
      };
    }
    case MediaLibraryActions.SetArtist: {
      // data.mediaArtist: MediaArtist - artist which needs to be loaded
      // data.mediaArtistAlbums: MediaAlbum[] - artist albums which can be loaded
      const {
        mediaArtist,
        mediaArtistAlbums,
      } = action.data;

      return {
        ...state,
        mediaSelectedArtist: mediaArtist,
        mediaSelectedArtistAlbums: mediaArtistAlbums,
      };
    }
    case MediaLibraryActions.SetArtists: {
      // data.mediaArtists: MediaArtist[] - artists which are needed to be added
      const { mediaArtists } = action.data;

      return {
        ...state,
        mediaArtists: MediaUtils.sortMediaArtists(mediaArtists),
      };
    }
    case MediaLibraryActions.SetPlaylists: {
      // data.mediaPlaylists: MediaPlaylist - playlists which need to be loaded
      const {
        mediaPlaylists,
      } = action.data;

      return {
        ...state,
        mediaPlaylists,
      };
    }
    case MediaLibraryActions.RemovePlaylist: {
      // data.mediaPlaylistId: string - playlist id which need to be removed
      const {
        mediaPlaylistId,
      } = action.data;

      const { mediaPlaylists } = state;
      let { mediaSelectedPlaylist } = state;

      const mediaPlaylistsUpdated = mediaPlaylists.filter(playlist => playlist.id !== mediaPlaylistId);
      mediaSelectedPlaylist = mediaSelectedPlaylist && mediaSelectedPlaylist.id !== mediaPlaylistId ? mediaSelectedPlaylist : undefined;

      return {
        ...state,
        mediaSelectedPlaylist,
        mediaPlaylists: mediaPlaylistsUpdated,
      };
    }
    case MediaLibraryActions.AddPlaylist: {
      // data.mediaPlaylist: IMediaPlaylist - playlist need to be added
      const { mediaPlaylist } = action.data;
      const { mediaPlaylists } = state;
      let { mediaSelectedPlaylist } = state;

      const mediaPlaylistIdx = mediaPlaylists.findIndex(exMediaPlaylist => mediaPlaylist.id === exMediaPlaylist.id);
      if (mediaPlaylistIdx === -1) {
        ArrayUtils.updateSortedArray<IMediaPlaylist>(mediaPlaylists, mediaPlaylist, MediaUtils.mediaPlaylistComparator);
      } else {
        mediaPlaylists[mediaPlaylistIdx] = mediaPlaylist;
      }

      if (mediaSelectedPlaylist?.id === mediaPlaylist.id) {
        mediaSelectedPlaylist = mediaPlaylist;
      }

      return {
        ...state,
        mediaPlaylists,
        mediaSelectedPlaylist,
      };
    }
    case MediaLibraryActions.SetPlaylist: {
      // data.mediaPlaylist: IMediaPlaylist - playlist need to be loaded
      const { mediaPlaylist } = action.data;

      return {
        ...state,
        mediaSelectedPlaylist: mediaPlaylist,
      };
    }
    case MediaLibraryActions.SetLikedTracks: {
      // data.mediaLikedTracks: IMediaLikedTrack[]
      const { mediaLikedTracks } = action.data;

      return {
        ...state,
        mediaLikedTracksRecord: keyBy(
          mediaLikedTracks,
          track => MediaUtils.getLikedTrackKey(track),
        ),
      };
    }
    case MediaLibraryActions.AddMediaTrackToLiked: {
      // data.mediaLikedTrack: IMediaLikedTrack - liked track to be added
      const { mediaLikedTrack } = action.data;
      const mediaLikedTrackKey = MediaUtils.getLikedTrackKey(mediaLikedTrack);

      if (state.mediaLikedTracksRecord[mediaLikedTrackKey]) {
        // already there, skip update
        return state;
      }

      return {
        ...state,
        mediaLikedTracksRecord: {
          ...state.mediaLikedTracksRecord,
          [mediaLikedTrackKey]: mediaLikedTrack,
        },
      };
    }
    case MediaLibraryActions.RemoveMediaTrackFromLiked: {
      // data.mediaLikedTrackInput: IMediaLikedTrackInput
      const { mediaLikedTrackInput } = action.data;
      const mediaLikedTrackKey = MediaUtils.getLikedTrackKeyFromInput(mediaLikedTrackInput);

      if (!state.mediaLikedTracksRecord[mediaLikedTrackKey]) {
        // already removed, skip update
        return state;
      }

      return {
        ...state,
        mediaLikedTracksRecord: omit(state.mediaLikedTracksRecord, mediaLikedTrackKey),
      };
    }
    case MediaLibraryActions.SetPinnedItems: {
      // data.mediaPinnedItems: IMediaPinnedItem[]
      const { mediaPinnedItems } = action.data;

      return {
        ...state,
        mediaPinnedItemsRecord: keyBy(
          mediaPinnedItems,
          (item: IMediaPinnedItem) => MediaUtils.getPinnedItemKey(item),
        ),
      };
    }
    case MediaLibraryActions.AddPinnedItem: {
      // data.mediaPinnedItem: IMediaPinnedItem
      const { mediaPinnedItem } = action.data;
      const mediaPinnedItemKey = MediaUtils.getPinnedItemKey(mediaPinnedItem);

      if (state.mediaPinnedItemsRecord[mediaPinnedItemKey]) {
        // already there, skip update
        return state;
      }

      return {
        ...state,
        mediaPinnedItemsRecord: {
          ...state.mediaPinnedItemsRecord,
          [mediaPinnedItemKey]: mediaPinnedItem,
        },
      };
    }
    case MediaLibraryActions.RemovePinnedCollectionItem: {
      // data.mediaCollectionItem: IMediaCollectionItem
      const { mediaPinnedItemInput } = action.data;
      const mediaPinnedItemKey = MediaUtils.getPinnedItemKeyFromInput(mediaPinnedItemInput);

      if (!state.mediaPinnedItemsRecord[mediaPinnedItemKey]) {
        // already removed, skip update
        return state;
      }

      return {
        ...state,
        mediaPinnedItemsRecord: omit(state.mediaPinnedItemsRecord, mediaPinnedItemKey),
      };
    }
    default:
      return state;
  }
};

import { MediaEnums } from '../enums';
import { IMediaAlbum, IMediaArtist, IMediaTrack } from '../interfaces';
import { ArrayUtils, MediaUtils } from '../utils';

export type MediaLibraryState = {
  mediaAlbums: IMediaAlbum[],
  mediaArtists: IMediaArtist[],
  mediaSelectedAlbum?: IMediaAlbum,
  mediaSelectedAlbumTracks?: IMediaTrack[],
  mediaSelectedArtist?: IMediaArtist,
  mediaSelectedArtistAlbums?: IMediaAlbum[],
  mediaIsSyncing: boolean,
};

export type MediaLibraryStateAction = {
  type: MediaEnums.MediaLibraryActions,
  data?: any,
};

const mediaLibraryInitialState: MediaLibraryState = {
  mediaAlbums: [],
  mediaArtists: [],
  mediaIsSyncing: false,
};

export default (state: MediaLibraryState = mediaLibraryInitialState, action: MediaLibraryStateAction): MediaLibraryState => {
  switch (action.type) {
    case MediaEnums.MediaLibraryActions.Initialize: {
      // data.mediaProviderIdentifier
      // TODO: To be implemented

      return state;
    }
    case MediaEnums.MediaLibraryActions.StartSync: {
      // data.mediaProviderIdentifier

      return {
        ...state,
        mediaIsSyncing: true,
      };
    }
    case MediaEnums.MediaLibraryActions.FinishSync: {
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
    case MediaEnums.MediaLibraryActions.AddTrack: {
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
    case MediaEnums.MediaLibraryActions.AddAlbum: {
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
    case MediaEnums.MediaLibraryActions.SetAlbums: {
      // data.mediaAlbums: MediaAlbum[] - albums which are needed to be added
      const { mediaAlbums } = action.data;

      return {
        ...state,
        mediaAlbums: MediaUtils.sortMediaAlbums(mediaAlbums),
      };
    }
    case MediaEnums.MediaLibraryActions.SetAlbum: {
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
    case MediaEnums.MediaLibraryActions.AddArtist: {
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
    case MediaEnums.MediaLibraryActions.SetArtist: {
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
    default:
      return state;
  }
};

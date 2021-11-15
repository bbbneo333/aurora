import * as _ from 'lodash';

import {MediaEnums} from '../enums';
import {IMediaAlbum, IMediaArtist, IMediaTrack} from '../interfaces';
import {ArrayUtils, MediaUtils} from '../utils';

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
    case MediaEnums.MediaLibraryActions.InitializeSafe: {
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
      if (!state.mediaIsSyncing) {
        throw new Error(`MediaLibraryReducer encountered error at StopSync - Sync not started yet - ${action.data.mediaProviderIdentifier}`);
      }

      return {
        ...state,
        mediaIsSyncing: false,
      };
    }
    case MediaEnums.MediaLibraryActions.AddTrack: {
      // data.mediaTrack: MediaTrack - track which needs to be added
      const {mediaTrack} = action.data;
      const {mediaSelectedAlbum} = state;
      let {mediaSelectedAlbumTracks} = state;

      // location #1 - mediaSelectedAlbumTracks (if selected album was found)
      if (mediaSelectedAlbum && mediaSelectedAlbum.id === mediaTrack.track_album.id) {
        mediaSelectedAlbumTracks = mediaSelectedAlbumTracks || [];

        // only add the track if it does not already exists
        if (_.isNil(mediaSelectedAlbumTracks.find(mediaAlbumTrack => mediaAlbumTrack.id === mediaTrack.id))) {
          ArrayUtils.updateSortedArray<IMediaTrack>(mediaSelectedAlbumTracks, mediaTrack, MediaUtils.mediaTrackInsertComparator);
        }
      }

      return {
        ...state,
        mediaSelectedAlbumTracks,
      };
    }
    case MediaEnums.MediaLibraryActions.RemoveTrack: {
      // data.mediaTrack: MediaTrack - track which needs to be removed
      const {mediaTrack} = action.data;
      let {mediaSelectedAlbumTracks} = state;

      // location #1 - mediaSelectedAlbumTracks
      if (!_.isEmpty(mediaSelectedAlbumTracks)) {
        mediaSelectedAlbumTracks = _.filter(mediaSelectedAlbumTracks, mediaAlbumTrack => mediaAlbumTrack.id !== mediaTrack.id);
      }

      return {
        ...state,
        mediaSelectedAlbumTracks,
      };
    }
    case MediaEnums.MediaLibraryActions.AddAlbumSafe: {
      // data.mediaAlbum: MediaAlbum - album which needs to be added
      const {mediaAlbum} = action.data;
      const {mediaAlbums} = state;

      if (_.isNil(mediaAlbums.find(exMediaAlbum => exMediaAlbum.id === mediaAlbum.id))) {
        ArrayUtils.updateSortedArray<IMediaAlbum>(mediaAlbums, mediaAlbum, MediaUtils.mediaAlbumInsertionComparator);
      }

      return {
        ...state,
        mediaAlbums,
      };
    }
    case MediaEnums.MediaLibraryActions.LoadAlbum: {
      // data.mediaAlbum: MediaAlbum - album which needs to be loaded
      // data.mediaAlbumTracks: MediaTrack[] - album tracks which can be loaded
      const {
        mediaAlbum,
        mediaAlbumTracks,
      } = action.data;

      return {
        ...state,
        mediaSelectedAlbum: mediaAlbum,
        mediaSelectedAlbumTracks: MediaUtils.mediaAlbumTrackSort(mediaAlbumTracks),
      };
    }
    case MediaEnums.MediaLibraryActions.AddArtistSafe: {
      // data.mediaArtist: MediaArtist - artist which needs to be added
      const {mediaArtist} = action.data;
      const {mediaArtists} = state;

      if (_.isNil(mediaArtists.find(exMediaArtist => exMediaArtist.id === mediaArtist.id))) {
        ArrayUtils.updateSortedArray<IMediaArtist>(mediaArtists, mediaArtist, MediaUtils.mediaArtistInsertionComparator);
      }

      return {
        ...state,
        mediaArtists,
      };
    }
    case MediaEnums.MediaLibraryActions.LoadArtist: {
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

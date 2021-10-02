import * as _ from 'lodash';

import {MediaEnums} from '../enums';
import {IMediaAlbum, IMediaArtist, IMediaTrack} from '../interfaces';

export type MediaProviderLibraryState = {
  mediaAlbums: IMediaAlbum[],
  mediaArtists: IMediaArtist[],
  mediaSelectedAlbum?: IMediaAlbum,
  mediaSelectedAlbumTracks?: IMediaTrack[],
  mediaSelectedArtist?: IMediaArtist,
  mediaSelectedArtistAlbums?: IMediaAlbum[],
  mediaIsSyncing: boolean,
};

export type MediaLibraryState = Record<string, MediaProviderLibraryState>;

export type MediaLibraryStateAction = {
  type: MediaEnums.MediaLibraryActions,
  data?: any,
};

const mediaLibraryInitialState: MediaLibraryState = {};
const mediaProviderLibraryInitialState: MediaProviderLibraryState = {
  mediaAlbums: [],
  mediaArtists: [],
  mediaIsSyncing: false,
};

function loadMediaProviderLibrary(state: MediaLibraryState, mediaProviderIdentifier: string): MediaProviderLibraryState {
  const mediaProviderLibrary = state[mediaProviderIdentifier];
  if (!mediaProviderLibrary) {
    throw new Error(`MediaLibraryReducer encountered error at loadMediaProviderLibrary - Library not initialized - ${mediaProviderIdentifier}`);
  }
  return mediaProviderLibrary;
}

export default (state: MediaLibraryState = mediaLibraryInitialState, action: MediaLibraryStateAction): MediaLibraryState => {
  switch (action.type) {
    case MediaEnums.MediaLibraryActions.Initialize: {
      // data.mediaProviderIdentifier
      if (!_.isEmpty(state[action.data.mediaProviderIdentifier])) {
        throw new Error(`MediaLibraryReducer encountered error at Initialize - Library already initialized - ${action.data.mediaProviderIdentifier}`);
      }

      return {
        ...state,
        [action.data.mediaProviderIdentifier]: mediaProviderLibraryInitialState,
      };
    }
    case MediaEnums.MediaLibraryActions.InitializeSafe: {
      // data.mediaProviderIdentifier
      if (!_.isEmpty(state[action.data.mediaProviderIdentifier])) {
        // library has been already initialized, do nothing
        return state;
      }

      return {
        ...state,
        [action.data.mediaProviderIdentifier]: mediaProviderLibraryInitialState,
      };
    }
    case MediaEnums.MediaLibraryActions.StartSync: {
      // data.mediaProviderIdentifier
      const mediaProviderLibrary = loadMediaProviderLibrary(state, action.data.mediaProviderIdentifier);
      mediaProviderLibrary.mediaIsSyncing = true;

      return {
        ...state,
        [action.data.mediaProviderIdentifier]: mediaProviderLibrary,
      };
    }
    case MediaEnums.MediaLibraryActions.FinishSync: {
      // data.mediaProviderIdentifier
      const mediaProviderLibrary = loadMediaProviderLibrary(state, action.data.mediaProviderIdentifier);
      if (!mediaProviderLibrary.mediaIsSyncing) {
        throw new Error(`MediaLibraryReducer encountered error at StopSync - Sync not started yet - ${action.data.mediaProviderIdentifier}`);
      }
      mediaProviderLibrary.mediaIsSyncing = false;

      return {
        ...state,
        [action.data.mediaProviderIdentifier]: mediaProviderLibrary,
      };
    }
    case MediaEnums.MediaLibraryActions.AddTrack: {
      // data.mediaTrack: MediaTrack - track which needs to be added
      const {mediaTrack} = action.data;
      const mediaProviderIdentifier = mediaTrack.provider;

      const mediaProviderLibrary = loadMediaProviderLibrary(state, mediaProviderIdentifier);

      // location #1 - mediaSelectedAlbumTracks (if selected album was found)
      let {mediaSelectedAlbumTracks} = mediaProviderLibrary;
      if (mediaProviderLibrary.mediaSelectedAlbum && mediaProviderLibrary.mediaSelectedAlbum.id === mediaTrack.track_album.id) {
        mediaSelectedAlbumTracks = mediaSelectedAlbumTracks || [];

        // only add the track if it does not already exists
        if (_.isNil(mediaSelectedAlbumTracks.find(mediaAlbumTrack => mediaAlbumTrack.id === mediaTrack.id))) {
          mediaSelectedAlbumTracks.push(mediaTrack);
        }
      }
      mediaProviderLibrary.mediaSelectedAlbumTracks = mediaSelectedAlbumTracks;

      return {
        ...state,
        [mediaProviderIdentifier]: mediaProviderLibrary,
      };
    }
    case MediaEnums.MediaLibraryActions.RemoveTrack: {
      // data.mediaTrack: MediaTrack - track which needs to be removed
      const {mediaTrack} = action.data;
      const mediaProviderIdentifier = mediaTrack.provider;

      const mediaProviderLibrary = loadMediaProviderLibrary(state, mediaProviderIdentifier);

      // location #1 - mediaSelectedAlbumTracks
      let {mediaSelectedAlbumTracks} = mediaProviderLibrary;
      if (!_.isEmpty(mediaSelectedAlbumTracks)) {
        mediaSelectedAlbumTracks = _.filter(mediaSelectedAlbumTracks, mediaAlbumTrack => mediaAlbumTrack.id !== mediaTrack.id);
      }
      mediaProviderLibrary.mediaSelectedAlbumTracks = mediaSelectedAlbumTracks;

      return {
        ...state,
        [mediaProviderIdentifier]: mediaProviderLibrary,
      };
    }
    case MediaEnums.MediaLibraryActions.AddAlbum: {
      // data.mediaAlbum: MediaAlbum - album which needs to be added
      const {mediaAlbum} = action.data;
      const mediaProviderIdentifier = mediaAlbum.provider;

      const mediaProviderLibrary = loadMediaProviderLibrary(state, mediaProviderIdentifier);
      mediaProviderLibrary.mediaAlbums.push(mediaAlbum);

      return {
        ...state,
        [mediaProviderIdentifier]: mediaProviderLibrary,
      };
    }
    case MediaEnums.MediaLibraryActions.LoadAlbum: {
      // data.mediaAlbum: MediaAlbum - album which needs to be loaded
      // data.mediaAlbumTracks: MediaTrack[] - album tracks which can be loaded
      const {
        mediaAlbum,
        mediaAlbumTracks,
      } = action.data;
      const mediaProviderIdentifier = mediaAlbum.provider;

      const mediaProviderLibrary = loadMediaProviderLibrary(state, mediaProviderIdentifier);
      mediaProviderLibrary.mediaSelectedAlbum = mediaAlbum;
      mediaProviderLibrary.mediaSelectedAlbumTracks = mediaAlbumTracks;

      return {
        ...state,
        [mediaProviderIdentifier]: mediaProviderLibrary,
      };
    }
    case MediaEnums.MediaLibraryActions.AddArtist: {
      // data.mediaArtist: MediaArtist - artist which needs to be added
      const {mediaArtist} = action.data;
      const mediaProviderIdentifier = mediaArtist.provider;

      const mediaProviderLibrary = loadMediaProviderLibrary(state, mediaProviderIdentifier);
      mediaProviderLibrary.mediaArtists.push(mediaArtist);

      return {
        ...state,
        [mediaProviderIdentifier]: mediaProviderLibrary,
      };
    }
    case MediaEnums.MediaLibraryActions.LoadArtist: {
      // data.mediaArtist: MediaArtist - artist which needs to be loaded
      // data.mediaArtistAlbums: MediaAlbum[] - artist albums which can be loaded
      const {
        mediaArtist,
        mediaArtistAlbums,
      } = action.data;
      const mediaProviderIdentifier = mediaArtist.provider;

      const mediaProviderLibrary = loadMediaProviderLibrary(state, mediaProviderIdentifier);
      mediaProviderLibrary.mediaSelectedArtist = mediaArtist;
      mediaProviderLibrary.mediaSelectedArtistAlbums = mediaArtistAlbums;

      return {
        ...state,
        [mediaProviderIdentifier]: mediaProviderLibrary,
      };
    }
    default:
      return state;
  }
};

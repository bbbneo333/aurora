import * as _ from 'lodash';

import {MediaEnums} from '../enums';
import {StringUtils} from '../utils';

import {
  IMediaPlayback,
  IMediaQueueTrack,
  IMediaTrack,
  IMediaTrackList,
} from '../interfaces';

export type MediaPlayerState = {
  mediaTracks: IMediaQueueTrack[];
  mediaPlaybackState: MediaEnums.MediaPlaybackState;
  mediaPlaybackCurrentMediaTrack?: IMediaQueueTrack;
  mediaPlaybackCurrentTrackList?: IMediaTrackList,
  mediaPlaybackCurrentMediaProgress?: number;
  mediaPlaybackCurrentPlayingInstance?: IMediaPlayback;
  mediaPlaybackVolumeMaxLimit: number,
  mediaPlaybackVolumeCurrent: number,
  mediaPlaybackVolumeMuted: boolean,
  mediaPlaybackQueueOnShuffle: boolean,
};

export type MediaPlayerStateAction = {
  type: MediaEnums.MediaPlayerActions,
  data?: any,
};

const mediaPlayerInitialState: MediaPlayerState = {
  mediaTracks: [],
  mediaPlaybackState: MediaEnums.MediaPlaybackState.Stopped,
  mediaPlaybackCurrentMediaTrack: undefined,
  mediaPlaybackCurrentTrackList: undefined,
  mediaPlaybackCurrentMediaProgress: undefined,
  mediaPlaybackCurrentPlayingInstance: undefined,
  mediaPlaybackVolumeMaxLimit: 100,
  mediaPlaybackVolumeCurrent: 100,
  mediaPlaybackVolumeMuted: false,
  mediaPlaybackQueueOnShuffle: false,
};

const getMediaQueueTracksForTrackList = (
  mediaTracks: IMediaTrack[],
  mediaTrackList: IMediaTrackList,
): IMediaQueueTrack[] => mediaTracks.map(mediaTrack => ({
  ...mediaTrack,
  tracklist_id: mediaTrackList.id,
  queue_entry_id: StringUtils.generateId(),
}));

const getMediaQueueTrack = (mediaTrack: IMediaTrack): IMediaQueueTrack => ({
  ...mediaTrack,
  tracklist_id: mediaTrack.track_album.id,
  queue_entry_id: StringUtils.generateId(),
});

export default (state: MediaPlayerState = mediaPlayerInitialState, action: MediaPlayerStateAction): MediaPlayerState => {
  switch (action.type) {
    case MediaEnums.MediaPlayerActions.SetTrack: {
      // data.mediaTrack: MediaTrack - track which needs to be added
      return {
        ...state,
        mediaTracks: [getMediaQueueTrack(action.data.mediaTrack)],
      };
    }
    case MediaEnums.MediaPlayerActions.SetTracks: {
      // data.mediaTracks: MediaTrack - tracks which needs to be added
      // data.mediaTrackList: MediaTrackList - tracklist from which media is being added
      return {
        ...state,
        mediaTracks: getMediaQueueTracksForTrackList(action.data.mediaTracks, action.data.mediaTrackList),
        mediaPlaybackCurrentTrackList: action.data.mediaTrackList,
      };
    }
    case MediaEnums.MediaPlayerActions.RemoveTrack: {
      // data.mediaTrackId: String - track's id which needs to be removed
      return {
        ...state,
        mediaTracks: _.filter(state.mediaTracks, mediaTrack => mediaTrack.id !== action.data.mediaTrackId),
      };
    }
    case MediaEnums.MediaPlayerActions.LoadTrack: {
      // data.mediaTrackId: string - track's id from the list which needs to be loaded
      // data.mediaPlayingInstance: any - playback instance
      const mediaTrackToLoad = _.find(state.mediaTracks, mediaTrack => mediaTrack.id === action.data.mediaTrackId);
      if (!mediaTrackToLoad) {
        throw new Error('MediaPlayerReducer encountered error at LoadTrack - Provided media track was not found');
      }

      return {
        ...state,
        mediaPlaybackState: MediaEnums.MediaPlaybackState.Loading,
        mediaPlaybackCurrentMediaTrack: mediaTrackToLoad,
        mediaPlaybackCurrentMediaProgress: undefined,
        mediaPlaybackCurrentPlayingInstance: action.data.mediaPlayingInstance,
      };
    }
    case MediaEnums.MediaPlayerActions.LoadExistingTrack: {
      if (!state.mediaPlaybackCurrentMediaTrack) {
        throw new Error('MediaPlayerReducer encountered error at LoadExistingTrack - No existing loaded track was found');
      }

      return {
        ...state,
        mediaPlaybackState: MediaEnums.MediaPlaybackState.Loading,
      };
    }
    case MediaEnums.MediaPlayerActions.Play: {
      // data.mediaPlaybackProgress?: number
      if (!state.mediaPlaybackCurrentMediaTrack) {
        throw new Error('MediaPlayerReducer encountered error at Play - No loaded media track was found');
      }

      return {
        ...state,
        mediaPlaybackState: MediaEnums.MediaPlaybackState.Playing,
        mediaPlaybackCurrentMediaProgress: action.data.mediaPlaybackProgress || 0,
      };
    }
    case MediaEnums.MediaPlayerActions.PausePlayer: {
      return {
        ...state,
        mediaPlaybackState: MediaEnums.MediaPlaybackState.Paused,
      };
    }
    case MediaEnums.MediaPlayerActions.StopPlayer: {
      return {
        ...state,
        mediaPlaybackState: MediaEnums.MediaPlaybackState.Stopped,
        mediaPlaybackCurrentMediaProgress: 0,
      };
    }
    case MediaEnums.MediaPlayerActions.UpdatePlaybackProgress: {
      // data.mediaPlaybackProgress: number
      if (!state.mediaPlaybackCurrentMediaTrack) {
        throw new Error('MediaPlayerReducer encountered error at UpdatePlaybackProgress - No loaded media track was found');
      }

      return {
        ...state,
        mediaPlaybackCurrentMediaProgress: action.data.mediaPlaybackProgress,
      };
    }
    case MediaEnums.MediaPlayerActions.UpdatePlaybackVolume: {
      // data.mediaPlaybackVolume: number
      return {
        ...state,
        mediaPlaybackVolumeCurrent: action.data.mediaPlaybackVolume,
      };
    }
    case MediaEnums.MediaPlayerActions.MutePlaybackVolume: {
      return {
        ...state,
        mediaPlaybackVolumeMuted: true,
      };
    }
    case MediaEnums.MediaPlayerActions.UnmutePlaybackVolume: {
      return {
        ...state,
        mediaPlaybackVolumeMuted: false,
      };
    }
    case MediaEnums.MediaPlayerActions.SetShuffle: {
      // data.mediaPlaybackQueueShuffle: boolean - toggle state
      return {
        ...state,
        mediaPlaybackQueueOnShuffle: action.data.mediaPlaybackQueueShuffle,
      };
    }
    default:
      return state;
  }
};

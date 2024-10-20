import _ from 'lodash';

import { MediaEnums } from '../enums';
import { IMediaPlayback, IMediaQueueTrack, IMediaTrackList } from '../interfaces';

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
  mediaPlaybackQueueRepeatType?: MediaEnums.MediaPlaybackRepeatType,
  mediaTrackLastInsertedQueueId?: string,
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
  mediaPlaybackQueueRepeatType: undefined,
  mediaTrackLastInsertedQueueId: undefined,
};

export default (state: MediaPlayerState = mediaPlayerInitialState, action: MediaPlayerStateAction): MediaPlayerState => {
  switch (action.type) {
    case MediaEnums.MediaPlayerActions.SetTrack: {
      // data.mediaTrack: IMediaQueueTrack - track which needs to be added
      const { mediaTrack } = action.data;
      if (!mediaTrack) {
        throw new Error('MediaPlayerReducer encountered error at SetTrack - No media track was provided');
      }

      return {
        ...state,
        mediaTracks: [mediaTrack],
        mediaTrackLastInsertedQueueId: undefined,
        mediaPlaybackCurrentTrackList: undefined,
      };
    }
    case MediaEnums.MediaPlayerActions.SetTracks: {
      // data.mediaTracks: IMediaQueueTrack[] - tracks which needs to be added
      // data.mediaTrackList?: MediaTrackList - tracklist from which media is being added
      // data.mediaTrackLastInsertedQueueId?: string - optional track queue id can be provided which keeps track of
      // last inserted item in the queue
      // important - if not provided, mediaTrackList will be reset
      // important - if not provided, mediaTrackLastInsertedQueueId will be reset
      const {
        mediaTracks,
        mediaTrackList,
        mediaTrackLastInsertedQueueId,
      } = action.data;

      return {
        ...state,
        mediaTracks,
        mediaTrackLastInsertedQueueId,
        mediaPlaybackCurrentTrackList: mediaTrackList,
      };
    }
    case MediaEnums.MediaPlayerActions.LoadingTrack: {
      return {
        ...state,
        mediaPlaybackState: MediaEnums.MediaPlaybackState.Loading,
      };
    }
    case MediaEnums.MediaPlayerActions.LoadTrack: {
      // data.mediaQueueTrackEntryId: string - track's queue entry id
      // data.mediaPlayingInstance: any - playback instance
      const {
        mediaQueueTrackEntryId,
        mediaPlayingInstance,
      } = action.data;

      const mediaTrackToLoad = _.find(state.mediaTracks, mediaTrack => mediaTrack.queue_entry_id === mediaQueueTrackEntryId);
      if (!mediaTrackToLoad) {
        throw new Error('MediaPlayerReducer encountered error at LoadTrack - Provided media track was not found');
      }

      return {
        ...state,
        mediaPlaybackState: MediaEnums.MediaPlaybackState.Paused,
        mediaPlaybackCurrentMediaTrack: mediaTrackToLoad,
        mediaPlaybackCurrentMediaProgress: undefined,
        mediaPlaybackCurrentPlayingInstance: mediaPlayingInstance,
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
      // data.mediaPlaybackQueueOnShuffle: boolean - shuffle state
      const { mediaPlaybackQueueOnShuffle } = action.data;

      return {
        ...state,
        mediaPlaybackQueueOnShuffle,
      };
    }
    case MediaEnums.MediaPlayerActions.SetRepeat: {
      // data.mediaPlaybackQueueRepeatType: MediaEnums.MediaPlaybackRepeatType | undefined - repeat type
      const { mediaPlaybackQueueRepeatType } = action.data;

      return {
        ...state,
        mediaPlaybackQueueRepeatType,
      };
    }
    default:
      return state;
  }
};

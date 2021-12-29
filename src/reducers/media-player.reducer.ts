import * as _ from 'lodash';

import {MediaEnums} from '../enums';
import {IMediaPlayback, IMediaQueueTrack, IMediaTrackList} from '../interfaces';

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
      const {mediaTrack} = action.data;
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
      // data.mediaTrackList: MediaTrackList - tracklist from which media is being added
      const {mediaTracks, mediaTrackList} = action.data;

      return {
        ...state,
        mediaTracks,
        mediaTrackLastInsertedQueueId: undefined,
        mediaPlaybackCurrentTrackList: mediaTrackList,
      };
    }
    case MediaEnums.MediaPlayerActions.AddTrack: {
      // data.mediaTrack: IMediaQueueTrack - track which needs to be inserted
      const {mediaTrack} = action.data;
      if (!mediaTrack) {
        throw new Error('MediaPlayerReducer encountered error at AddTrack - No media track was provided');
      }

      const {
        mediaTracks,
        mediaPlaybackCurrentMediaTrack,
        mediaTrackLastInsertedQueueId,
      } = state;

      // determine where media track will get inserted
      // by default, it will get inserted at the end of the list
      // if mediaTrackLastInsertedQueueId is present, track will be inserted after that track
      // otherwise, if mediaPlaybackCurrentMediaTrack is present, track will be inserted after that track
      let mediaTrackExistingPointer;
      let mediaTrackInsertPointer = mediaTracks.length - 1;

      if (mediaTrackLastInsertedQueueId) {
        mediaTrackExistingPointer = _.findIndex(mediaTracks, track => track.queue_entry_id === mediaTrackLastInsertedQueueId);
      } else if (mediaPlaybackCurrentMediaTrack) {
        mediaTrackExistingPointer = _.findIndex(mediaTracks, track => track.queue_entry_id === mediaPlaybackCurrentMediaTrack.queue_entry_id);
      }
      if (!_.isNil(mediaTrackExistingPointer)) {
        mediaTrackInsertPointer = mediaTrackExistingPointer + 1;
      }

      mediaTracks.splice(mediaTrackInsertPointer, 0, mediaTrack);

      return {
        ...state,
        mediaTracks,
        mediaTrackLastInsertedQueueId: mediaTrack.queue_entry_id,
      };
    }
    case MediaEnums.MediaPlayerActions.RemoveTrack: {
      // data.mediaTrackId: String - track's id which needs to be removed
      return {
        ...state,
        mediaTracks: _.filter(state.mediaTracks, mediaTrack => mediaTrack.id !== action.data.mediaTrackId),
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
      const {mediaPlaybackQueueOnShuffle} = action.data;

      return {
        ...state,
        mediaPlaybackQueueOnShuffle,
      };
    }
    case MediaEnums.MediaPlayerActions.SetRepeat: {
      // data.mediaPlaybackQueueRepeatType: MediaEnums.MediaPlaybackRepeatType | undefined - repeat type
      const {mediaPlaybackQueueRepeatType} = action.data;

      return {
        ...state,
        mediaPlaybackQueueRepeatType,
      };
    }
    default:
      return state;
  }
};

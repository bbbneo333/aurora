import * as _ from 'lodash';

// @ts-ignore
import {Howl} from 'howler';

import {MediaEnums} from '../enums';
import {MediaTrack} from '../models';

export interface MediaPlayerAudio {
  audio: Howl;
  audio_playback_id: number;
}

export interface MediaPlayerState {
  mediaTracks: MediaTrack[];
  mediaPlaybackState: MediaEnums.MediaPlayerPlaybackState;
  mediaPlaybackCurrentMediaAudio?: MediaPlayerAudio;
  mediaPlaybackCurrentMediaTrack?: MediaTrack;
}

export interface MediaPlayerStateAction {
  type: MediaEnums.MediaPlayerActions,
  data?: any,
}

const mediaPlayerInitialState: MediaPlayerState = {
  mediaTracks: [],
  mediaPlaybackState: MediaEnums.MediaPlayerPlaybackState.Idle,
  mediaPlaybackCurrentMediaAudio: undefined,
  mediaPlaybackCurrentMediaTrack: undefined,
};

export default (state: MediaPlayerState = mediaPlayerInitialState, action: MediaPlayerStateAction): MediaPlayerState => {
  switch (action.type) {
    case MediaEnums.MediaPlayerActions.ClearTracks: {
      return {
        ...state,
        mediaTracks: [],
      };
    }
    case MediaEnums.MediaPlayerActions.AddTrack: {
      // data.mediaTrack: MediaTrack - track which needs to be added
      return {
        ...state,
        mediaTracks: [...state.mediaTracks, action.data.mediaTrack],
      };
    }
    case MediaEnums.MediaPlayerActions.RemoveTrack: {
      // data.mediaTrackId: String - track's id which needs to be removed
      return {
        ...state,
        mediaTracks: _.filter(state.mediaTracks, mediaTrack => mediaTrack.id !== action.data.mediaTrackId),
      };
    }
    case MediaEnums.MediaPlayerActions.PlayTrack: {
      // data.mediaTrackId: string - track's id from the list which needs to be played
      const mediaTrackToPlay = _.find(state.mediaTracks, mediaTrack => mediaTrack.id === action.data.mediaTrackId);
      if (!mediaTrackToPlay) {
        throw new Error('MediaPlayerReducer encountered error at PlayTrack - Provided media track was not found');
      }

      return {
        ...state,
        mediaPlaybackState: MediaEnums.MediaPlayerPlaybackState.Loading,
        mediaPlaybackCurrentMediaTrack: mediaTrackToPlay,
      };
    }
    case MediaEnums.MediaPlayerActions.Play: {
      // data.mediaAudio: MediaPlayerAudio - track's audio instance which has been loaded successfully
      return {
        ...state,
        mediaPlaybackState: MediaEnums.MediaPlayerPlaybackState.Playing,
        mediaPlaybackCurrentMediaAudio: action.data.mediaAudio,
      };
    }
    case MediaEnums.MediaPlayerActions.Pause: {
      return {
        ...state,
        mediaPlaybackState: MediaEnums.MediaPlayerPlaybackState.Paused,
      };
    }
    case MediaEnums.MediaPlayerActions.Stop: {
      return {
        ...state,
        mediaPlaybackState: MediaEnums.MediaPlayerPlaybackState.Idle,
        mediaPlaybackCurrentMediaAudio: undefined,
        mediaPlaybackCurrentMediaTrack: undefined,
      };
    }
    default:
      return state;
  }
};

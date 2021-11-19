import * as _ from 'lodash';

import {MediaEnums} from '../enums';
import {ArrayUtils, StringUtils} from '../utils';

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
): IMediaQueueTrack[] => mediaTracks.map((mediaTrack, mediaTrackPointer) => ({
  ...mediaTrack,
  tracklist_id: mediaTrackList.id,
  queue_entry_id: StringUtils.generateId(),
  queue_insertion_index: mediaTrackPointer,
}));

const getMediaQueueTrack = (mediaTrack: IMediaTrack): IMediaQueueTrack => ({
  ...mediaTrack,
  tracklist_id: mediaTrack.track_album.id,
  queue_entry_id: StringUtils.generateId(),
  queue_insertion_index: 0,
});

const getShuffledMediaTracks = (
  mediaTracks: IMediaQueueTrack[],
): IMediaQueueTrack[] => ArrayUtils.shuffleArray(mediaTracks);

const getSortedMediaTracks = (
  mediaTracks: IMediaQueueTrack[],
): IMediaQueueTrack[] => _.sortBy(mediaTracks, mediaTrack => mediaTrack.queue_insertion_index);

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
      const {mediaTracks, mediaTrackList} = action.data;
      const {mediaPlaybackQueueOnShuffle} = state;

      const mediaListTracks = getMediaQueueTracksForTrackList(mediaTracks, mediaTrackList);
      const mediaQueueTracks = mediaPlaybackQueueOnShuffle
        ? getShuffledMediaTracks(mediaListTracks)
        : getSortedMediaTracks(mediaListTracks);

      return {
        ...state,
        mediaTracks: mediaQueueTracks,
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
      // data.mediaPlaybackQueueOnShuffle: boolean - shuffle state
      const {mediaPlaybackQueueOnShuffle} = action.data;
      const {mediaPlaybackCurrentMediaTrack, mediaTracks} = state;

      // important - when shuffle is requested, only the tracks except the current one are shuffled
      // the current one then is always placed first and rest of the list is filled with shuffled tracks
      let mediaQueueTracks: IMediaQueueTrack[] = [];
      if (mediaPlaybackQueueOnShuffle) {
        if (mediaPlaybackCurrentMediaTrack) {
          const mediaTracksToShuffle = _.filter(mediaTracks, mediaTrack => mediaTrack.queue_entry_id !== mediaPlaybackCurrentMediaTrack.queue_entry_id);
          const mediaTracksShuffled = getShuffledMediaTracks(mediaTracksToShuffle);

          mediaQueueTracks = [mediaPlaybackCurrentMediaTrack, ...mediaTracksShuffled];
        } else {
          mediaQueueTracks = getShuffledMediaTracks(mediaTracks);
        }
      } else {
        mediaQueueTracks = getSortedMediaTracks(mediaTracks);
      }

      return {
        ...state,
        mediaTracks: mediaQueueTracks,
        mediaPlaybackQueueOnShuffle,
      };
    }
    default:
      return state;
  }
};

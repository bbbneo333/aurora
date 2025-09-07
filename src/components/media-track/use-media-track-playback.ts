import _ from 'lodash';
import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { IMediaTrack } from '../../interfaces';
import { RootState } from '../../reducers';
import { useMediaTrackList } from '../../contexts';
import { MediaEnums } from '../../enums';
import { MediaPlayerService } from '../../services';

export function useMediaTrackPlayback<T extends IMediaTrack>(props: {
  mediaTrack: T,
  mediaTrackPointer?: number,
  onMediaTrackPlay?: (mediaTrack: T) => void,
  isPlaying?: boolean, // use the flag to force the playback state, otherwise uses the global playback state
}) {
  const {
    mediaTrack,
    mediaTrackPointer,
    onMediaTrackPlay,
    isPlaying = false,
  } = props;

  const {
    mediaPlaybackState,
    mediaPlaybackCurrentMediaTrack,
  } = useSelector((state: RootState) => state.mediaPlayer);

  const {
    mediaTracks,
    mediaTrackList,
  } = useMediaTrackList();

  const isTrackPlaying = isPlaying || (mediaPlaybackState === MediaEnums.MediaPlaybackState.Playing
    && mediaPlaybackCurrentMediaTrack
    && mediaPlaybackCurrentMediaTrack.tracklist_id === mediaTrackList?.id
    && mediaPlaybackCurrentMediaTrack.id === mediaTrack.id);

  const play = useCallback(() => {
    if (onMediaTrackPlay) {
      onMediaTrackPlay(mediaTrack);
    } else if (!_.isEmpty(mediaTracks)) {
      // when playing from a list, media track pointer is required to be provided
      if (_.isNil(mediaTrackPointer)) {
        throw new Error('MediaTrackActionButton encountered error while playing track - MediaTrack pointer was not provided');
      }

      MediaPlayerService.playMediaTrackFromList(mediaTracks, mediaTrackPointer, mediaTrackList);
    } else {
      MediaPlayerService.playMediaTrack(mediaTrack);
    }
  }, [
    onMediaTrackPlay,
    mediaTrack,
    mediaTrackPointer,
    mediaTracks,
    mediaTrackList,
  ]);

  const pause = useCallback(() => {
    MediaPlayerService.pauseMediaPlayer();
  }, []);

  const toggle = useCallback(() => {
    if (isTrackPlaying) {
      pause();
    } else {
      play();
    }
  }, [
    isTrackPlaying,
    pause,
    play,
  ]);

  return {
    isTrackPlaying,
    play,
    pause,
    toggle,
  };
}

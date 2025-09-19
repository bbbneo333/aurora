import { useSelector } from 'react-redux';
import { useCallback } from 'react';
import { isEmpty } from 'lodash';

import { MediaPlaybackState } from '../enums';
import { IMediaCollectionItem } from '../interfaces';
import { RootState } from '../reducers';
import { MediaCollectionService, MediaPlayerService } from '../services';

export type UseMediaCollectionPlaybackProps = {
  mediaItem: IMediaCollectionItem,
};

export function useMediaCollectionPlayback(props: UseMediaCollectionPlaybackProps) {
  const {
    mediaItem,
  } = props;

  const {
    mediaPlaybackState,
    mediaPlaybackCurrentTrackList,
  } = useSelector((state: RootState) => state.mediaPlayer);

  const isMediaActive = mediaPlaybackCurrentTrackList
    && mediaPlaybackCurrentTrackList.id === mediaItem.id;

  const isMediaPlaying = mediaPlaybackState === MediaPlaybackState.Playing
    && isMediaActive;

  const play = useCallback(() => {
    MediaCollectionService
      .getMediaCollectionTracks(mediaItem)
      .then((mediaTracks) => {
        if (isEmpty(mediaTracks)) {
          console.warn(`useMediaCollectionPlayback got empty track list for ${mediaItem.type} - ${mediaItem.id}, skipping playback...`);
          return;
        }

        MediaPlayerService.playMediaTracks(mediaTracks, {
          id: mediaItem.id,
        });
      });
  }, [
    mediaItem,
  ]);

  const pause = useCallback(() => {
    MediaPlayerService.pauseMediaPlayer();
  }, []);

  const toggle = useCallback(() => {
    if (isMediaPlaying) {
      pause();
    } else {
      play();
    }
  }, [
    isMediaPlaying,
    pause,
    play,
  ]);

  return {
    isMediaActive,
    isMediaPlaying,
    play,
    pause,
    toggle,
  };
}

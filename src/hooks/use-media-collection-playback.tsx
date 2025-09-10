import { useSelector } from 'react-redux';
import { useCallback } from 'react';

import { MediaEnums } from '../enums';
import { IMediaCollectionItem } from '../interfaces';
import { MediaLibraryService, MediaPlayerService } from '../services';
import { RootState } from '../reducers';

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

  const isMediaPlaying = mediaPlaybackState === MediaEnums.MediaPlaybackState.Playing
    && mediaPlaybackCurrentTrackList
    && mediaPlaybackCurrentTrackList.id === mediaItem.id;

  const play = useCallback((e: Event) => {
    MediaLibraryService
      .getMediaCollectionTracks(mediaItem)
      .then((mediaTracks) => {
        MediaPlayerService.playMediaTracks(mediaTracks, {
          id: mediaItem.id,
        });
      });

    // this action button resides within a link
    // stop propagation to prevent that
    e.preventDefault();
    e.stopPropagation();
  }, [
    mediaItem,
  ]);

  const pause = useCallback((e: Event) => {
    MediaPlayerService.pauseMediaPlayer();

    // this action button resides within a link
    // stop propagation to prevent that
    e.preventDefault();
    e.stopPropagation();
  }, []);

  return {
    isMediaPlaying,
    play,
    pause,
  };
}

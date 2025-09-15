import { useCallback, useEffect, useState } from 'react';
import { every, isEmpty, isNil } from 'lodash';
import { useSelector } from 'react-redux';

import { IMediaTrack } from '../interfaces';
import { RootState } from '../reducers';
import { MediaLibraryLikedTrackService } from '../services';

export function useMediaTrackLike(props: {
  mediaTrack?: IMediaTrack;
  mediaTracks?: IMediaTrack[],
}) {
  const { mediaTrack, mediaTracks } = props;
  const [isLikeStatusLoading, setIsLikeStatusLoading] = useState(false);

  const mediaLikedTracks = useSelector((state: RootState) => state.mediaLibrary.mediaLikedTracks);
  const isTrackLiked = mediaTrack && !isNil(mediaLikedTracks[mediaTrack.id]);
  const areAllTracksLiked = mediaTracks && every(mediaTracks, track => !isNil(mediaLikedTracks[track.id]));

  useEffect(() => {
    if (!mediaTrack) {
      return;
    }

    MediaLibraryLikedTrackService.loadTrackLikedStatus(mediaTrack.id);
  }, [
    mediaTrack,
  ]);

  useEffect(() => {
    if (!mediaTracks || isEmpty(mediaTracks)) {
      return;
    }

    mediaTracks.forEach((track: IMediaTrack) => {
      MediaLibraryLikedTrackService.loadTrackLikedStatus(track.id);
    });
  }, [
    mediaTracks,
  ]);

  const toggleLike = useCallback(async () => {
    setIsLikeStatusLoading(true);

    try {
      if (mediaTrack) {
        if (isTrackLiked) {
          // remove
          await MediaLibraryLikedTrackService.removeTrackFromLiked(mediaTrack.id);
        } else {
          // add
          await MediaLibraryLikedTrackService.addTrackToLiked(mediaTrack.id);
        }
      } else if (mediaTracks && !isEmpty(mediaTracks)) {
        if (areAllTracksLiked) {
          // remove
          await MediaLibraryLikedTrackService.removeTracksFromLiked(mediaTracks.map(track => track.id));
        } else {
          // add
          await MediaLibraryLikedTrackService.addTracksToLiked(mediaTracks.map(track => track.id));
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLikeStatusLoading(false);
    }
  }, [
    areAllTracksLiked,
    isTrackLiked,
    mediaTrack,
    mediaTracks,
  ]);

  return {
    isTrackLiked,
    isLikeStatusLoading,
    areAllTracksLiked,
    toggleLike,
  };
}

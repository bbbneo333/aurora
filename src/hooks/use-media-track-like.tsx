import { useCallback, useEffect, useState } from 'react';
import { isEmpty } from 'lodash';
import { useSelector } from 'react-redux';

import { IMediaTrack } from '../interfaces';
import { makeSelectIsTrackLiked, makeSelectAreAllTracksLiked } from '../selectors';
import { MediaLikedTrackService } from '../services';

export function useMediaTrackLike(props: {
  mediaTrack?: IMediaTrack;
  mediaTracks?: IMediaTrack[],
}) {
  const { mediaTrack, mediaTracks } = props;
  const [isLikeStatusLoading, setIsLikeStatusLoading] = useState(false);

  const isTrackLiked = useSelector(makeSelectIsTrackLiked(mediaTrack));
  const areAllTracksLiked = useSelector(makeSelectAreAllTracksLiked(mediaTracks));

  useEffect(() => {
    if (!mediaTrack) {
      return;
    }

    MediaLikedTrackService.loadTrackLikedStatus(mediaTrack);
  }, [
    mediaTrack,
  ]);

  useEffect(() => {
    if (!mediaTracks || isEmpty(mediaTracks)) {
      return;
    }

    mediaTracks.forEach((track: IMediaTrack) => {
      MediaLikedTrackService.loadTrackLikedStatus(track);
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
          await MediaLikedTrackService.removeTrackFromLiked(mediaTrack);
        } else {
          // add
          await MediaLikedTrackService.addTrackToLiked(mediaTrack);
        }
      } else if (mediaTracks && !isEmpty(mediaTracks)) {
        if (areAllTracksLiked) {
          // remove
          await MediaLikedTrackService.removeTracksFromLiked(mediaTracks);
        } else {
          // add
          await MediaLikedTrackService.addTracksToLiked(mediaTracks);
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

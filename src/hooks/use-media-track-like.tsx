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

  const { mediaTracksLiked } = useSelector((state: RootState) => state.mediaLibrary);
  const isTrackLiked = mediaTrack && !isNil(mediaTracksLiked[mediaTrack.id]);
  const areAllTracksLiked = mediaTracks && every(mediaTracks, track => !isNil(mediaTracksLiked[track.id]));

  useEffect(() => {
    if (!mediaTrack) {
      return;
    }

    MediaLibraryLikedTrackService.loadTrackLikedStatus(mediaTrack.id, mediaTrack);
  }, [
    mediaTrack,
  ]);

  useEffect(() => {
    if (!mediaTracks || isEmpty(mediaTracks)) {
      return;
    }

    mediaTracks.forEach((track: IMediaTrack) => {
      MediaLibraryLikedTrackService.loadTrackLikedStatus(track.id, track);
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
          await MediaLibraryLikedTrackService.removeTrackFromLiked(mediaTrack.id, mediaTrack);
        } else {
          // add
          await MediaLibraryLikedTrackService.addTrackToLiked(mediaTrack.id, mediaTrack);
        }
      } else if (mediaTracks && !isEmpty(mediaTracks)) {
        if (areAllTracksLiked) {
          // remove
          await MediaLibraryLikedTrackService.removeTracksFromLiked(mediaTracks.map(track => ({
            mediaTrackId: track.id,
            mediaLikedTrackData: track,
          })));
        } else {
          // add
          await MediaLibraryLikedTrackService.addTracksToLiked(mediaTracks.map(track => ({
            mediaTrackId: track.id,
            mediaLikedTrackData: track,
          })));
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

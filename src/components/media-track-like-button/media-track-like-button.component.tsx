import React, { useCallback, useEffect, useState } from 'react';
import classNames from 'classnames/bind';

import { IMediaTrack } from '../../interfaces';
import { Icons } from '../../constants';
import { MediaLibraryService } from '../../services';

import { Icon } from '../icon/icon.component';
import { Button, ButtonProps } from '../button/button.component';

import styles from './media-track-like-button.component.css';

const cx = classNames.bind(styles);

export function MediaTrackLikeButton(props: {
  mediaTrack: IMediaTrack;
} & ButtonProps) {
  const { mediaTrack, className, ...rest } = props;
  const [mediaTrackIsLiked, setMediaTrackIsLiked] = useState(false);
  const [mediaTrackLikeDisabled, setMediaTrackLikeDisabled] = useState(false);

  useEffect(() => {
    setMediaTrackLikeDisabled(true);

    MediaLibraryService.checkIfTrackIsLiked(mediaTrack)
      .then((isLiked) => {
        setMediaTrackIsLiked(isLiked);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setMediaTrackLikeDisabled(false);
      });
  }, [
    mediaTrack,
  ]);

  const handleButtonClick = useCallback(async () => {
    setMediaTrackLikeDisabled(true);

    try {
      if (mediaTrackIsLiked) {
        // remove
        await MediaLibraryService.removeTrackFromLiked(mediaTrack);
        setMediaTrackIsLiked(false);
      } else {
        // add
        await MediaLibraryService.addTrackToLiked(mediaTrack);
        setMediaTrackIsLiked(true);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setMediaTrackLikeDisabled(false);
    }
  }, [
    mediaTrack,
    mediaTrackIsLiked,
  ]);

  return (
    <Button
      {...rest}
      className={cx(className, 'media-track-like-button', { active: mediaTrackIsLiked })}
      disabled={mediaTrackLikeDisabled}
      onButtonSubmit={handleButtonClick}
    >
      <Icon
        className={cx('media-track-like-icon')}
        name={mediaTrackIsLiked ? Icons.MediaLiked : Icons.MediaLike}
      />
    </Button>
  );
}

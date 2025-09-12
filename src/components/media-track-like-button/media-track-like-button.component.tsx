import React from 'react';
import classNames from 'classnames/bind';

import { IMediaTrack } from '../../interfaces';
import { Icons } from '../../constants';
import { useMediaTrackLike } from '../../hooks';

import { Icon } from '../icon/icon.component';
import { Button, ButtonProps } from '../button/button.component';

import styles from './media-track-like-button.component.css';

const cx = classNames.bind(styles);

export function MediaTrackLikeButton(props: {
  mediaTrack: IMediaTrack;
} & ButtonProps) {
  const { mediaTrack, className, ...rest } = props;
  const { isTrackLiked, isLikeStatusLoading, toggleLike } = useMediaTrackLike({ mediaTrack });

  return (
    <Button
      {...rest}
      className={cx(className, 'media-track-like-button', { active: isTrackLiked })}
      disabled={isLikeStatusLoading}
      onButtonSubmit={toggleLike}
    >
      <Icon
        className={cx('media-track-like-icon')}
        name={isTrackLiked ? Icons.MediaLiked : Icons.MediaLike}
      />
    </Button>
  );
}

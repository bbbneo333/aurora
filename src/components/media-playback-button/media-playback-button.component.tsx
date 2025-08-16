import React from 'react';
import classNames from 'classnames/bind';

import { Icons } from '../../constants';

import { Icon } from '../icon/icon.component';
import { Button } from '../button/button.component';

import styles from './media-playback-button.component.css';

const cx = classNames.bind(styles);

export function MediaPlaybackButton(props: {
  isPlaying?: boolean;
  disabled?: boolean;
  className?: string;
  variant?: 'inline' | 'outlined';
  onPlay: (e: Event) => void;
  onPause: (e: Event) => void;
}) {
  const {
    isPlaying = false,
    disabled = false,
    className,
    variant = 'inline',
    onPlay,
    onPause,
  } = props;

  return (
    <>
      {
        isPlaying ? (
          <Button
            className={cx('media-playback-button', variant, className)}
            onButtonSubmit={onPause}
            disabled={disabled}
          >
            <Icon name={Icons.MediaPause}/>
          </Button>
        ) : (
          <Button
            className={cx('media-playback-button', variant, className)}
            onButtonSubmit={onPlay}
            disabled={disabled}
          >
            <Icon name={Icons.MediaPlay}/>
          </Button>
        )
      }
    </>
  );
}

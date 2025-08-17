import React from 'react';
import classNames from 'classnames/bind';
import { omit } from 'lodash';

import { Icons } from '../../constants';

import { Icon } from '../icon/icon.component';
import { Button, ButtonProps } from '../button/button.component';

import styles from './media-playback-button.component.css';

const cx = classNames.bind(styles);

// important - ButtonProps extends HTMLDivElement which also has onPlay and onPause
export type MediaPlaybackButtonProps = Omit<ButtonProps, 'onPlay' | 'onPause'> & {
  isPlaying?: boolean;
  onPlay: (e: Event) => void;
  onPause: (e: Event) => void;
};

export function MediaPlaybackButton(props: MediaPlaybackButtonProps) {
  const {
    isPlaying = false,
    className,
    onPlay,
    onPause,
  } = props;

  const buttonProps = omit(props, [
    'isPlaying',
    'className',
    'onPlay',
    'onPause',
  ]);

  return (
    <>
      {
        isPlaying ? (
          <Button
            {...buttonProps}
            className={cx('media-playback-button', className)}
            onButtonSubmit={onPause}
          >
            <Icon name={Icons.MediaPause}/>
          </Button>
        ) : (
          <Button
            {...buttonProps}
            className={cx('media-playback-button', className)}
            onButtonSubmit={onPlay}
          >
            <Icon name={Icons.MediaPlay}/>
          </Button>
        )
      }
    </>
  );
}

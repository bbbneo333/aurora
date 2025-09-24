import React, { HTMLAttributes } from 'react';
import classNames from 'classnames/bind';

import { Icons } from '../../constants';
import { IMediaTrack } from '../../interfaces';
import { DateTimeUtils, Events } from '../../utils';
import { useMediaTrackPlayback } from '../../hooks';

import { MediaCoverPicture } from '../media-cover-picture/media-cover-picture.component';
import { MediaTrackInfoComponent } from '../media-track-info/media-track-info.component';
import { MediaPlaybackButton } from '../media-playback-button/media-playback-button.component';
import { MediaTrackLikeButton } from '../media-track-like-button/media-track-like-button.component';

import styles from './media-track.component.css';

const cx = classNames.bind(styles);

export type MediaTrackProps<T> = {
  mediaTrack: T;
  mediaTrackPointer?: number;
  onMediaTrackPlay?: (mediaTrack: T) => void;
  isPlaying?: boolean;
  disableCover?: boolean;
  disableAlbumLink?: boolean;
  isSelected?: boolean;
  isActive?: boolean;
} & HTMLAttributes<HTMLDivElement>;

export function MediaTrack<T extends IMediaTrack>(props: MediaTrackProps<T>) {
  const {
    mediaTrack,
    mediaTrackPointer,
    onMediaTrackPlay,
    isPlaying = false,
    disableCover = false,
    disableAlbumLink = false,
    isSelected = false,
    isActive = false,
    className,
    onDoubleClick,
    onKeyDown,
    ...rest
  } = props;

  const {
    play,
    pause,
    toggle,
    isTrackActive,
    isTrackPlaying,
  } = useMediaTrackPlayback({
    mediaTrack,
    mediaTrackPointer,
    onMediaTrackPlay,
    isPlaying,
  });

  return (
    <div
      role="row"
      tabIndex={0}
      {...rest}
      className={cx('media-track', className, {
        current: isActive || isTrackActive,
        selected: isSelected || rest['aria-selected'],
      })}
      onDoubleClick={(e) => {
        onDoubleClick?.(e);
        toggle();
      }}
      onKeyDown={(e) => {
        onKeyDown?.(e);
        if (Events.isEnterKey(e) && e.target === e.currentTarget) toggle();
      }}
    >
      <div className={cx('media-track-content')}>
        <div className={cx('media-track-section')}>
          <MediaPlaybackButton
            isPlaying={isTrackPlaying}
            className={cx('media-track-playback-button')}
            onPlay={play}
            onPause={pause}
            tabIndex={-1}
          />
        </div>
        {!disableCover && (
          <div className={cx('media-track-section')}>
            <MediaCoverPicture
              mediaPicture={mediaTrack.track_cover_picture}
              mediaPictureAltText={mediaTrack.track_name}
              className={cx('media-track-cover')}
              mediaCoverPlaceholderIcon={Icons.TrackPlaceholder}
            />
          </div>
        )}
        <div className={cx('media-track-section')}>
          <MediaTrackInfoComponent
            mediaTrack={mediaTrack}
            disableAlbumLink={disableAlbumLink}
            className={cx('media-track-info')}
          />
        </div>
        <div className={cx('media-track-section', 'media-track-side-column')}>
          <div className={cx('media-track-like')}>
            <MediaTrackLikeButton
              mediaTrack={mediaTrack}
              className={cx('media-track-like-button')}
            />
          </div>
          <div className={cx('media-track-duration')}>
            {DateTimeUtils.formatSecondsToDuration(mediaTrack.track_duration)}
          </div>
        </div>
      </div>
    </div>
  );
}

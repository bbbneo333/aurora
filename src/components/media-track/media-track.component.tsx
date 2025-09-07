import React, { HTMLAttributes } from 'react';
import classNames from 'classnames/bind';

import { IMediaTrack } from '../../interfaces';
import { DateTimeUtils, Events } from '../../utils';

import { MediaCoverPicture } from '../media-cover-picture/media-cover-picture.component';
import { MediaTrackInfoComponent } from '../media-track-info/media-track-info.component';
import { MediaPlaybackButton } from '../media-playback-button/media-playback-button.component';

import styles from './media-track.component.css';
import { useMediaTrackPlayback } from './use-media-track-playback';

const cx = classNames.bind(styles);

export type MediaTrackProps<T> = {
  mediaTrack: T;
  mediaTrackPointer?: number;
  onMediaTrackPlay?: (mediaTrack: T) => void;
  isPlaying?: boolean;
  disableCover?: boolean;
  disableAlbumLink?: boolean;
} & HTMLAttributes<HTMLDivElement>;

export const MediaTrack = React.forwardRef<HTMLDivElement, MediaTrackProps<IMediaTrack>>((props, ref) => {
  const {
    mediaTrack,
    mediaTrackPointer,
    onMediaTrackPlay,
    isPlaying = false,
    disableCover = false,
    disableAlbumLink = false,
    className,
    onDoubleClick,
    onKeyDown,
    ...rest
  } = props;

  const {
    play,
    pause,
    toggle,
    isTrackPlaying,
  } = useMediaTrackPlayback({
    mediaTrack,
    mediaTrackPointer,
    onMediaTrackPlay,
    isPlaying,
  });

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      {...rest}
      ref={ref}
      className={cx('media-track', className)}
      onDoubleClick={(e) => {
        onDoubleClick?.(e);
        toggle();
      }}
      onKeyDown={(e) => {
        onKeyDown?.(e);
        if (Events.isEnterKey(e) || Events.isSpaceKey(e)) toggle();
      }}
    >
      <div className={cx('media-track-main-column')}>
        <div className={cx('media-track-section')}>
          <MediaPlaybackButton
            isPlaying={isTrackPlaying}
            className={cx('media-track-playback-button')}
            onPlay={play}
            onPause={pause}
          />
        </div>
        {!disableCover && (
          <div className={cx('media-track-section')}>
            <MediaCoverPicture
              mediaPicture={mediaTrack.track_cover_picture}
              mediaPictureAltText={mediaTrack.track_name}
              className={cx('media-track-cover')}
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
      </div>
      <div className={cx('media-track-side-column')}>
        <div className={cx('media-track-duration')}>
          {DateTimeUtils.formatSecondsToDuration(mediaTrack.track_duration)}
        </div>
      </div>
    </div>
  );
});

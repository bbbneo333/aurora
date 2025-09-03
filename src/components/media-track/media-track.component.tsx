import React, { useCallback } from 'react';
import classNames from 'classnames/bind';

import { useContextMenu, useMediaTrackList } from '../../contexts';
import { SystemEnums } from '../../enums';
import { IMediaTrack } from '../../interfaces';
import { DateTimeUtils } from '../../utils';

import { MediaCoverPicture } from '../media-cover-picture/media-cover-picture.component';
import { MediaTrackInfoComponent } from '../media-track-info/media-track-info.component';
import { MediaPlaybackButton } from '../media-playback-button/media-playback-button.component';

import styles from './media-track.component.css';
import { useMediaTrackPlayback } from './use-media-track-playback';

const cx = classNames.bind(styles);

export type MediaTrackProps<T> = {
  mediaTrack: T,
  mediaTrackPointer?: number,
  mediaTrackContextMenuId?: string;
  onMediaTrackPlay?: (mediaTrack: T) => void,
  isPlaying?: boolean,
  disableCover?: boolean,
  disableAlbumLink?: boolean,
  containerRef?: React.Ref<HTMLDivElement>,
  containerProps?: React.HTMLProps<HTMLDivElement>,
};

export function MediaTrack<T extends IMediaTrack>(props: MediaTrackProps<T>) {
  const {
    mediaTrack,
    mediaTrackPointer,
    mediaTrackContextMenuId,
    onMediaTrackPlay,
    isPlaying = false,
    disableCover = false,
    disableAlbumLink = false,
    containerRef,
    containerProps = {},
  } = props;

  const { showMenu } = useContextMenu();
  const { mediaTrackList } = useMediaTrackList();

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

  const handleOnContextMenu = useCallback((e: React.MouseEvent) => {
    if (mediaTrackContextMenuId) {
      showMenu({
        id: mediaTrackContextMenuId,
        event: e,
        props: {
          mediaTrack,
          mediaTrackList,
        },
      });
    }
  }, [
    showMenu,
    mediaTrack,
    mediaTrackList,
    mediaTrackContextMenuId,
  ]);

  return (
    // provide aria props via containerProps, setting anything here causes issues
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      {...containerProps}
      ref={containerRef}
      className={cx('media-track')}
      onContextMenu={handleOnContextMenu}
      onDoubleClick={() => {
        toggle();
      }}
      onKeyDown={(e) => {
        if (e.key === SystemEnums.KeyboardKeyCodes.Enter
          || e.key === SystemEnums.KeyboardKeyCodes.Space) {
          e.preventDefault();
          toggle();
        }
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
}

import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import classNames from 'classnames/bind';
import _ from 'lodash';

import { useContextMenu, useMediaTrackList } from '../../contexts';
import { MediaEnums } from '../../enums';
import { IMediaTrack } from '../../interfaces';
import { RootState } from '../../reducers';
import { MediaPlayerService } from '../../services';
import { DateTimeUtils } from '../../utils';

import { MediaCoverPicture } from '../media-cover-picture/media-cover-picture.component';
import { MediaTrackInfoComponent } from '../media-track-info/media-track-info.component';
import { MediaPlaybackButton } from '../media-playback-button/media-playback-button.component';

import styles from './media-track.component.css';

const cx = classNames.bind(styles);

export type MediaTrackProps<T> = {
  mediaTrack: T,
  mediaTrackPointer?: number,
  mediaTrackContextMenuId?: string;
  onMediaTrackPlay?: (mediaTrack: T) => void,
  isPlaying?: boolean,
  disableCover?: boolean,
  disableAlbumLink?: boolean,
};

function useMediaTrackPlayback<T extends IMediaTrack>(props: {
  mediaTrack: T,
  mediaTrackPointer?: number,
  onMediaTrackPlay?: (mediaTrack: T) => void,
  isPlaying?: boolean, // use the flag to force the playback state, otherwise uses the global playback state
}) {
  const {
    mediaTrack,
    mediaTrackPointer,
    onMediaTrackPlay,
    isPlaying = false,
  } = props;

  const {
    mediaPlaybackState,
    mediaPlaybackCurrentMediaTrack,
  } = useSelector((state: RootState) => state.mediaPlayer);

  const {
    mediaTracks,
    mediaTrackList,
  } = useMediaTrackList();

  const isTrackPlaying = isPlaying || (mediaPlaybackState === MediaEnums.MediaPlaybackState.Playing
    && mediaPlaybackCurrentMediaTrack
    && mediaPlaybackCurrentMediaTrack.tracklist_id === mediaTrackList?.id
    && mediaPlaybackCurrentMediaTrack.id === mediaTrack.id);

  const play = useCallback(() => {
    if (onMediaTrackPlay) {
      onMediaTrackPlay(mediaTrack);
    } else if (!_.isEmpty(mediaTracks)) {
      // when playing from a list, media track pointer is required to be provided
      if (_.isNil(mediaTrackPointer)) {
        throw new Error('MediaTrackActionButton encountered error while playing track - MediaTrack pointer was not provided');
      }

      MediaPlayerService.playMediaTrackFromList(mediaTracks, mediaTrackPointer, mediaTrackList);
    } else {
      MediaPlayerService.playMediaTrack(mediaTrack);
    }
  }, [
    onMediaTrackPlay,
    mediaTrack,
    mediaTrackPointer,
    mediaTracks,
    mediaTrackList,
  ]);

  const pause = useCallback(() => {
    MediaPlayerService.pauseMediaPlayer();
  }, []);

  const toggle = useCallback(() => {
    if (isTrackPlaying) {
      pause();
    } else {
      play();
    }
  }, [
    isTrackPlaying,
    pause,
    play,
  ]);

  return {
    isTrackPlaying,
    play,
    pause,
    toggle,
  };
}

export function MediaTrack<T extends IMediaTrack>(props: MediaTrackProps<T>) {
  const {
    mediaTrack,
    mediaTrackPointer,
    mediaTrackContextMenuId,
    onMediaTrackPlay,
    isPlaying = false,
    disableCover = false,
    disableAlbumLink = false,
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

  // mediaTrackPointer can be used for providing position for a MediaTrack within a list
  // this information can be then used for setting accessibility control over our MediaTrack container
  const mediaTrackAriaProps = !_.isNil(mediaTrackPointer) && {
    role: 'row',
    tabIndex: mediaTrackPointer + 1,
    'aria-rowindex': mediaTrackPointer + 1,
  };

  return (
    <div
      className={cx('col-12 mb-3')}
      onContextMenu={handleOnContextMenu}
      onDoubleClick={() => {
        toggle();
      }}
    >
      <div className={cx('media-track')} {...mediaTrackAriaProps}>
        <div className="row">
          <div className={cx('col-10', 'media-track-main-column')}>
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
          <div className={cx('col-2', 'media-track-side-column')}>
            <div className={cx('media-track-duration')}>
              {DateTimeUtils.formatSecondsToDuration(mediaTrack.track_duration)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

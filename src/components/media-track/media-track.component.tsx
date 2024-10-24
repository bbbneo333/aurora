import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import classNames from 'classnames/bind';
import _ from 'lodash';
import { useContextMenu } from 'react-contexify';

import { Icons } from '../../constants';
import { useMediaTrackList } from '../../contexts';
import { MediaEnums } from '../../enums';
import { IMediaTrack } from '../../interfaces';
import { RootState } from '../../reducers';
import { MediaPlayerService } from '../../services';
import { DateTimeUtils } from '../../utils';

import { Icon } from '../icon/icon.component';
import { MediaCoverPicture } from '../media-cover-picture/media-cover-picture.component';
import { MediaTrackInfoComponent } from '../media-track-info/media-track-info.component';

import styles from './media-track.component.css';

const cx = classNames.bind(styles);

function MediaTrackActionButton(props: {
  mediaTrack: IMediaTrack,
  mediaTrackPointer?: number,
  handleOnPlayButtonClick?: () => void,
  isPlaying?: boolean,
}) {
  const {
    mediaTrack,
    mediaTrackPointer,
    handleOnPlayButtonClick,
    isPlaying,
  } = props;

  const {
    mediaPlaybackState,
    mediaPlaybackCurrentMediaTrack,
  } = useSelector((state: RootState) => state.mediaPlayer);

  const {
    mediaTracks,
    mediaTrackList,
  } = useMediaTrackList();

  const handleOnMediaTrackPlayButtonClick = useCallback(() => {
    if (handleOnPlayButtonClick) {
      handleOnPlayButtonClick();
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
    handleOnPlayButtonClick,
    mediaTrack,
    mediaTrackPointer,
    mediaTracks,
    mediaTrackList,
  ]);

  const handleOnMediaTrackPauseButtonClick = useCallback(() => {
    MediaPlayerService.pauseMediaPlayer();
  }, []);

  const isMediaTrackPlaying = isPlaying || (mediaPlaybackState === MediaEnums.MediaPlaybackState.Playing
    && mediaPlaybackCurrentMediaTrack
    && mediaPlaybackCurrentMediaTrack.tracklist_id === mediaTrackList?.id
    && mediaPlaybackCurrentMediaTrack.id === mediaTrack.id);

  return (
    isMediaTrackPlaying
      ? (
        <button
          type="submit"
          className={cx('media-track-action-button')}
          onClick={handleOnMediaTrackPauseButtonClick}
        >
          <Icon name={Icons.MediaPause}/>
        </button>
      )
      : (
        <button
          type="submit"
          className={cx('media-track-action-button')}
          onClick={handleOnMediaTrackPlayButtonClick}
        >
          <Icon name={Icons.MediaPlay}/>
        </button>
      )
  );
}

export function MediaTrackComponent(props: {
  mediaTrack: IMediaTrack,
  mediaTrackPointer?: number,
  mediaTrackContextMenuId?: string;
  handleOnPlayButtonClick?: () => void,
  isPlaying?: boolean,
  disableCover?: boolean,
  disableAlbumLink?: boolean,
}) {
  const {
    mediaTrack,
    mediaTrackPointer,
    mediaTrackContextMenuId,
    handleOnPlayButtonClick,
    isPlaying,
    disableCover = false,
    disableAlbumLink = false,
  } = props;

  const { show } = useContextMenu();

  const handleOnContextMenu = useCallback((e: React.MouseEvent) => {
    if (mediaTrackContextMenuId) {
      show(e, {
        id: mediaTrackContextMenuId,
        props: {
          mediaTrack,
          // important - this component is also used for media queue tracks, in order to support actions for the same
          // we are supplying value for mediaQueueTrack as well
          mediaQueueTrack: mediaTrack,
        },
      });
    }
  }, [
    show,
    mediaTrack,
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
    <div className={cx('col-12 mb-3')} onContextMenu={handleOnContextMenu}>
      <div className={cx('media-track')} {...mediaTrackAriaProps}>
        <div className="row">
          <div className={cx('col-10', 'media-track-main-column')}>
            <div className={cx('media-track-section')}>
              <MediaTrackActionButton
                mediaTrack={mediaTrack}
                mediaTrackPointer={mediaTrackPointer}
                isPlaying={isPlaying}
                handleOnPlayButtonClick={handleOnPlayButtonClick}
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

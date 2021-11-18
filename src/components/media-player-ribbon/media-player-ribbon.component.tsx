import React, {useCallback, useRef, useState} from 'react';
import {useSelector} from 'react-redux';
import classNames from 'classnames/bind';
import {Col, Container, Row} from 'react-bootstrap';

import {Routes} from '../../constants';
import {MediaEnums} from '../../enums';
import {RootState} from '../../reducers';
import {MediaPlayerService} from '../../services';
import {DateTimeUtils} from '../../utils';

import {MediaButtonComponent} from '../media-button/media-button.component';
import {MediaProgressBarComponent} from '../media-progress-bar/media-progress-bar.component';
import {MediaTrackInfoComponent} from '../media-track-info/media-track-info.component';
import {MediaCoverPictureComponent} from '../media-cover-picture/media-cover-picture.component';
import {RouterLinkToggle} from '../router-link-toggle/router-link-toggle.component';

import styles from './media-player-ribbon.component.css';

const cx = classNames.bind(styles);

export function MediaPlayerRibbonComponent() {
  const mediaPlayer = useSelector((state: RootState) => state.mediaPlayer);

  const mediaPlaybackVolumeMidThreshold = useRef<number>(mediaPlayer.mediaPlaybackVolumeMaxLimit / 2);
  const [mediaProgressDragValue, setMediaProgressDragValue] = useState<number|undefined>(undefined);

  // TODO: Add implementation for setMediaVolumeDragStartValue
  const [mediaVolumeDragStartValue] = useState<number|undefined>(undefined);

  const handleOnMediaProgressDragUpdate = useCallback((value) => {
    setMediaProgressDragValue(value);
    // we don't want updated value to be committed
    return false;
  }, [
    setMediaProgressDragValue,
  ]);

  const handleOnMediaProgressDragCommit = useCallback((value) => {
    MediaPlayerService.seekMediaTrack(value);
    setMediaProgressDragValue(undefined);
  }, [
    setMediaProgressDragValue,
  ]);

  const handleOnVolumeChangeDragCommit = useCallback((value) => {
    MediaPlayerService.changeMediaPlayerVolume(value);
  }, []);

  const handleOnVolumeButtonSubmit = useCallback(() => {
    // in case the drag brought down the volume all the way to 0, we will try to raise the volume to either:
    // (a) maximum value from where the first drag started originally started, or
    // (b) maximum volume
    // otherwise in case we already have a volume > 0, simply unmute
    if (mediaPlayer.mediaPlaybackVolumeCurrent === 0) {
      MediaPlayerService.changeMediaPlayerVolume(mediaVolumeDragStartValue || mediaPlayer.mediaPlaybackVolumeMaxLimit);
    } else if (!mediaPlayer.mediaPlaybackVolumeMuted) {
      MediaPlayerService.muteMediaPlayerVolume();
    } else {
      MediaPlayerService.unmuteMediaPlayerVolume();
    }
  }, [
    mediaVolumeDragStartValue,
    mediaPlayer.mediaPlaybackVolumeCurrent,
    mediaPlayer.mediaPlaybackVolumeMaxLimit,
    mediaPlayer.mediaPlaybackVolumeMuted,
  ]);

  const handleOnMediaPlayPreviousButtonSubmit = useCallback(() => {
    // if the track has progressed for more than 30% of it's duration
    // or if we don't have any previous track in the queue
    // we will be seeking current track to 0
    // otherwise, we will be playing the next track
    if ((mediaPlayer.mediaPlaybackCurrentMediaTrack
        && mediaPlayer.mediaPlaybackCurrentMediaProgress
        && ((mediaPlayer.mediaPlaybackCurrentMediaProgress / mediaPlayer.mediaPlaybackCurrentMediaTrack.track_duration) * 100) > 30)
      || !MediaPlayerService.hasPreviousTrack()) {
      MediaPlayerService.seekMediaTrack(0);
    } else {
      MediaPlayerService.playPreviousTrack();
    }
  }, [
    mediaPlayer.mediaPlaybackCurrentMediaTrack,
    mediaPlayer.mediaPlaybackCurrentMediaProgress,
  ]);

  return (
    mediaPlayer.mediaPlaybackCurrentMediaTrack
      ? (
        <Container fluid className={cx('h-100')}>
          <Row className={cx('media-player-container')}>
            <Col className={cx('col-md-4 col-xl-3')}>
              <Row className={cx('media-player-info-container')}>
                <Col className={cx('col-12', 'media-player-info-column')}>
                  <MediaCoverPictureComponent
                    mediaPicture={mediaPlayer.mediaPlaybackCurrentMediaTrack.track_album.album_cover_picture}
                    mediaPictureAltText={mediaPlayer.mediaPlaybackCurrentMediaTrack.track_album.album_name}
                    className={cx('media-player-track-cover-image')}
                  />
                  <MediaTrackInfoComponent
                    mediaTrack={mediaPlayer.mediaPlaybackCurrentMediaTrack}
                    className={cx('media-player-track-info-container')}
                  />
                  <div className={cx('media-player-control', 'media-player-control-sm')}>
                    <i className="far fa-heart"/>
                  </div>
                </Col>
              </Row>
            </Col>
            <Col className={cx('col-md-4 col-xl-6')}>
              <Row className={cx('media-player-controls-container')}>
                <Col className={cx('col-12', 'media-player-controls-column')}>
                  <MediaButtonComponent
                    className={cx('media-player-control', 'media-player-control-sm', 'media-player-toggle', {
                      active: mediaPlayer.mediaPlaybackQueueOnShuffle,
                    })}
                    onButtonSubmit={() => {
                      MediaPlayerService.toggleShuffle();
                    }}
                  >
                    <i className="fas fa-random"/>
                  </MediaButtonComponent>
                  <MediaButtonComponent
                    className={cx('media-player-control', 'media-player-control-md')}
                    onButtonSubmit={handleOnMediaPlayPreviousButtonSubmit}
                  >
                    <i className="fas fa-step-backward"/>
                  </MediaButtonComponent>
                  {mediaPlayer.mediaPlaybackState === MediaEnums.MediaPlaybackState.Playing
                    ? (
                      <MediaButtonComponent
                        className={cx('media-player-control', 'media-player-control-lg')}
                        onButtonSubmit={() => {
                          MediaPlayerService.pauseMediaPlayer();
                        }}
                      >
                        <i className="fas fa-pause-circle"/>
                      </MediaButtonComponent>
                    )
                    : (
                      <MediaButtonComponent
                        disabled={mediaPlayer.mediaPlaybackState === MediaEnums.MediaPlaybackState.Loading}
                        className={cx('media-player-control', 'media-player-control-lg')}
                        onButtonSubmit={() => {
                          MediaPlayerService.resumeMediaPlayer();
                        }}
                      >
                        <i className="fas fa-play-circle"/>
                      </MediaButtonComponent>
                    )}
                  <MediaButtonComponent
                    className={cx('media-player-control', 'media-player-control-md')}
                    disabled={!MediaPlayerService.hasNextTrack()}
                    onButtonSubmit={() => {
                      MediaPlayerService.playNextTrack();
                    }}
                  >
                    <i className="fas fa-step-forward"/>
                  </MediaButtonComponent>
                  <MediaButtonComponent
                    disabled
                    className={cx('media-player-control', 'media-player-control-sm')}
                  >
                    <i className="fas fa-redo-alt"/>
                  </MediaButtonComponent>
                </Col>
              </Row>
              <Row className={cx('media-player-progress-container')}>
                <Col className={cx('col-12', 'media-player-progress-column')}>
                  <div className={cx('media-player-progress-counter', 'start')}>
                    {DateTimeUtils.formatSecondsToDuration(mediaProgressDragValue !== undefined
                      ? mediaProgressDragValue
                      : (mediaPlayer.mediaPlaybackCurrentMediaProgress || 0))}
                  </div>
                  <div className={cx('media-player-progress-bar-container')}>
                    <MediaProgressBarComponent
                      disabled={mediaPlayer.mediaPlaybackState === MediaEnums.MediaPlaybackState.Loading}
                      value={mediaPlayer.mediaPlaybackCurrentMediaProgress}
                      maxValue={mediaPlayer.mediaPlaybackCurrentMediaTrack.track_duration}
                      onDragUpdate={handleOnMediaProgressDragUpdate}
                      onDragCommit={handleOnMediaProgressDragCommit}
                    />
                  </div>
                  <div className={cx('media-player-progress-counter', 'end')}>
                    {DateTimeUtils.formatSecondsToDuration(mediaPlayer.mediaPlaybackCurrentMediaTrack.track_duration)}
                  </div>
                </Col>
              </Row>
            </Col>
            <Col className={cx('col-md-4 col-xl-3')}>
              <Row className={cx('media-player-side-container')}>
                <Col className={cx('col-md-10 col-lg-8', 'media-player-side-controls-column')}>
                  <RouterLinkToggle
                    to={Routes.PlayerQueue}
                    activeClassName={cx('active')}
                    className={cx('media-player-control', 'media-player-control-sm', 'media-player-toggle', 'app-nav-link')}
                  >
                    <i className="fas fa-list"/>
                  </RouterLinkToggle>
                  <MediaButtonComponent
                    className={cx('media-player-control', 'media-player-control-sm', 'media-player-volume-button')}
                    onButtonSubmit={handleOnVolumeButtonSubmit}
                  >
                    <i className={cx('fas', {
                      'fa-volume-up': !mediaPlayer.mediaPlaybackVolumeMuted
                        && mediaPlayer.mediaPlaybackVolumeCurrent !== 0
                        && mediaPlayer.mediaPlaybackVolumeCurrent > mediaPlaybackVolumeMidThreshold.current,
                      'fa-volume-down': !mediaPlayer.mediaPlaybackVolumeMuted
                        && mediaPlayer.mediaPlaybackVolumeCurrent !== 0
                        && mediaPlayer.mediaPlaybackVolumeCurrent <= mediaPlaybackVolumeMidThreshold.current,
                      'fa-volume-mute': mediaPlayer.mediaPlaybackVolumeMuted
                        || mediaPlayer.mediaPlaybackVolumeCurrent === 0,
                    })}
                    />
                  </MediaButtonComponent>
                  <div className={cx('media-player-volume-bar-container')}>
                    <MediaProgressBarComponent
                      autoCommitOnUpdate
                      value={mediaPlayer.mediaPlaybackVolumeMuted
                        ? 0
                        : mediaPlayer.mediaPlaybackVolumeCurrent}
                      maxValue={mediaPlayer.mediaPlaybackVolumeMaxLimit}
                      onDragCommit={handleOnVolumeChangeDragCommit}
                    />
                  </div>
                </Col>
              </Row>
            </Col>
          </Row>
        </Container>
      )
      : (
        <></>
      )
  );
}

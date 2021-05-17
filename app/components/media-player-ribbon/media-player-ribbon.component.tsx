import React, {useContext} from 'react';
import {useSelector} from 'react-redux';
import classNames from 'classnames/bind';
import {Col, Container, Row} from 'react-bootstrap';

import {MediaPlayerContext} from '../../contexts';
import {MediaEnums} from '../../enums';
import {RootState} from '../../reducers';
import {DateTimeUtils} from '../../utils';

import {MediaProgressBarComponent} from '../media-progress-bar/media-progress-bar.component';

import styles from './media-player-ribbon.component.css';

const cx = classNames.bind(styles);

export function MediaPlayerRibbonComponent() {
  const mediaPlayerContext = useContext(MediaPlayerContext);
  const mediaPlayer = useSelector((state: RootState) => state.mediaPlayer);

  if (!mediaPlayerContext) {
    throw new Error('MediaPlayerRibbonComponent encountered error - Missing context - MediaPlayerContext');
  }

  const {mediaPlayerManager} = mediaPlayerContext;

  return mediaPlayer.mediaPlaybackCurrentMediaTrack
    ? (
      <div className={cx('media-player-container')}>
        <Container fluid>
          <Row className={cx('media-player-content')}>
            <Col className={cx('col-3')}>
              <Row className={cx('media-player-info-container')}>
                <Col className={cx('col-4', 'media-track-album-artwork-column')}/>
                <Col className={cx('col-8', 'media-track-info-column')}>
                  <span className={cx('media-track-info-name')}>
                    {mediaPlayer.mediaPlaybackCurrentMediaTrack.track_name}
                  </span>
                  <span className={cx('media-track-info-album')}>
                    {mediaPlayer.mediaPlaybackCurrentMediaTrack.track_album_name}
                  </span>
                </Col>
              </Row>
            </Col>
            <Col className={cx('col-6')}>
              <Row className={cx('media-player-controls-container')}>
                <Col className={cx('media-player-controls-column')}>
                  <div className={cx('media-player-control', 'media-player-control-sm')}>
                    <i className="fas fa-random"/>
                  </div>
                  <div className={cx('media-player-control', 'media-player-control-md')}>
                    <i className="fas fa-step-backward"/>
                  </div>
                  {mediaPlayer.mediaPlaybackState === MediaEnums.MediaPlayerPlaybackState.Playing
                    ? (
                      // eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions
                      <div
                        className={cx('media-player-control', 'media-player-control-lg')}
                        onClick={() => {
                          mediaPlayerManager.pauseMediaPlayer();
                        }}
                      >
                        <i className="fas fa-pause-circle"/>
                      </div>
                    )
                    : (
                      // eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions
                      <div
                        className={cx('media-player-control', 'media-player-control-lg')}
                        onClick={() => {
                          mediaPlayerManager.resumeMediaPlayer();
                        }}
                      >
                        <i className="fas fa-play-circle"/>
                      </div>
                    )}
                  <div className={cx('media-player-control', 'media-player-control-md')}>
                    <i className="fas fa-step-forward"/>
                  </div>
                  <div className={cx('media-player-control', 'media-player-control-sm')}>
                    <i className="fas fa-redo-alt"/>
                  </div>
                </Col>
              </Row>
              <Row className={cx('media-player-progress-container')}>
                <Col className={cx('col-1', 'p-0', 'media-player-progress-counter-column', 'start')}>
                  {/* TODO: Add implementation */}
                  2:34
                </Col>
                <Col className={cx('col-10', 'media-player-progress-bar-column')}>
                  <MediaProgressBarComponent value={mediaPlayer.mediaPlaybackCurrentMediaProgress}/>
                </Col>
                <Col className={cx('col-1', 'p-0', 'media-player-progress-counter-column', 'end')}>
                  {DateTimeUtils.formatSecondsToMinutes(mediaPlayer.mediaPlaybackCurrentMediaTrack.track_duration)}
                </Col>
              </Row>
            </Col>
            <Col className={cx('col-3')}>
              <Row className={cx('media-player-side-container')}>
                <Col className={cx('col-1', 'media-player-side-control')}>
                  <i className="fas fa-list"/>
                </Col>
                <Col className={cx('col-1', 'media-player-side-control')}>
                  <i className="fas fa-volume-up"/>
                </Col>
                <Col className={cx('col-8')}>
                  <MediaProgressBarComponent
                    value={100}
                    progressContainerClassName={cx('media-player-volume-bar-container')}
                  />
                </Col>
              </Row>
            </Col>
          </Row>
        </Container>
      </div>
    )
    : (
      <div className={cx('media-player-no-content')}/>
    );
}

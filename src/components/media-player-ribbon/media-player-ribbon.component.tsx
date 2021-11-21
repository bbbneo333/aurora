import React from 'react';
import {useSelector} from 'react-redux';
import classNames from 'classnames/bind';
import {Col, Container, Row} from 'react-bootstrap';

import {RootState} from '../../reducers';

import styles from './media-player-ribbon.component.css';
import {MediaPlayerInfo} from './media-player-info.component';
import {MediaPlayerControls} from './media-player-controls.component';
import {MediaPlayerProgress} from './media-player-progress.component';
import {MediaPlayerSide} from './media-player-side.component';

const cx = classNames.bind(styles);

export function MediaPlayerRibbonComponent() {
  const {
    mediaPlaybackCurrentMediaTrack,
  } = useSelector((state: RootState) => state.mediaPlayer);

  if (!mediaPlaybackCurrentMediaTrack) {
    return (<></>);
  }

  return (
    <Container fluid className={cx('h-100')}>
      <Row className={cx('media-player-container')}>
        <Col className={cx('col-md-4 col-xl-3')}>
          <MediaPlayerInfo/>
        </Col>
        <Col className={cx('col-md-4 col-xl-6')}>
          <MediaPlayerControls/>
          <MediaPlayerProgress/>
        </Col>
        <Col className={cx('col-md-4 col-xl-3')}>
          <MediaPlayerSide/>
        </Col>
      </Row>
    </Container>
  );
}

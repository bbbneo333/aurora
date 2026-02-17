import React from 'react';
import classNames from 'classnames/bind';
import { Col, Container, Row } from 'react-bootstrap';

import styles from './media-player.component.css';
import { MediaPlayerInfo } from './media-player-info.component';
import { MediaPlayerControls } from './media-player-controls.component';
import { MediaPlayerProgress } from './media-player-progress.component';
import { MediaPlayerSide } from './media-player-side.component';
import { useMediaBackgroundTint } from './use-media-background-tint';

const cx = classNames.bind(styles);

export function MediaPlayer() {
  const { isTinted, tintColors } = useMediaBackgroundTint();

  return (
    <Container fluid className={cx('h-100')}>
      <Row
        className={cx('media-player-container', {
          tinted: isTinted,
        })}
        style={{
          '--media-player-tint-color-1': tintColors[0],
          '--media-player-tint-color-2': tintColors[1],
          '--media-player-tint-color-3': tintColors[2],
        } as React.CSSProperties}
      >
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

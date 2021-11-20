import React from 'react';
import {Col, Row} from 'react-bootstrap';
import classNames from 'classnames/bind';
import {useSelector} from 'react-redux';

import {RootState} from '../../reducers';

import {MediaCoverPictureComponent} from '../media-cover-picture/media-cover-picture.component';
import {MediaTrackInfoComponent} from '../media-track-info/media-track-info.component';

import styles from './media-player-ribbon.component.css';

const cx = classNames.bind(styles);

export function MediaPlayerInfo() {
  const {
    mediaPlaybackCurrentMediaTrack,
  } = useSelector((state: RootState) => state.mediaPlayer);

  if (!mediaPlaybackCurrentMediaTrack) {
    return (<></>);
  }

  return (
    <Row className={cx('media-player-info-container')}>
      <Col className={cx('col-12', 'media-player-info-column')}>
        <MediaCoverPictureComponent
          mediaPicture={mediaPlaybackCurrentMediaTrack.track_album.album_cover_picture}
          mediaPictureAltText={mediaPlaybackCurrentMediaTrack.track_album.album_name}
          className={cx('media-player-track-cover-image')}
        />
        <MediaTrackInfoComponent
          mediaTrack={mediaPlaybackCurrentMediaTrack}
          className={cx('media-player-track-info-container')}
        />
        <div className={cx('media-player-control', 'media-player-control-sm')}>
          <i className="far fa-heart"/>
        </div>
      </Col>
    </Row>
  );
}

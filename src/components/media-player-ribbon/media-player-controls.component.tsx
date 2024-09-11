import React from 'react';
import { Col, Row } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import classNames from 'classnames/bind';
import * as _ from 'lodash';

import { Icons } from '../../constants';
import { RootState } from '../../reducers';
import { MediaPlayerService } from '../../services';
import { MediaEnums } from '../../enums';

import { Icon } from '../icon/icon.component';
import { MediaButtonComponent } from '../media-button/media-button.component';

import styles from './media-player-ribbon.component.css';

const cx = classNames.bind(styles);

export function MediaPlayerControls() {
  const {
    mediaPlaybackState,
    mediaPlaybackQueueOnShuffle,
    mediaPlaybackQueueRepeatType,
  } = useSelector((state: RootState) => state.mediaPlayer);

  return (
    <Row className={cx('media-player-controls-container')}>
      <Col className={cx('col-12', 'media-player-controls-column')}>
        <MediaButtonComponent
          className={cx('media-player-control', 'media-player-control-sm', 'media-player-toggle', {
            active: mediaPlaybackQueueOnShuffle,
          })}
          onButtonSubmit={() => {
            MediaPlayerService.toggleShuffle();
          }}
        >
          <Icon name={Icons.PlayerShuffle}/>
        </MediaButtonComponent>
        <MediaButtonComponent
          className={cx('media-player-control', 'media-player-control-md')}
          onButtonSubmit={() => {
            MediaPlayerService.playPreviousTrack();
          }}
        >
          <Icon name={Icons.PlayerPrevious}/>
        </MediaButtonComponent>
        {mediaPlaybackState === MediaEnums.MediaPlaybackState.Playing
          ? (
            <MediaButtonComponent
              className={cx('media-player-control', 'media-player-control-lg')}
              onButtonSubmit={() => {
                MediaPlayerService.pauseMediaPlayer();
              }}
            >
              <Icon name={Icons.PlayerPause}/>
            </MediaButtonComponent>
          )
          : (
            <MediaButtonComponent
              disabled={mediaPlaybackState === MediaEnums.MediaPlaybackState.Loading}
              className={cx('media-player-control', 'media-player-control-lg')}
              onButtonSubmit={() => {
                MediaPlayerService.resumeMediaPlayer();
              }}
            >
              <Icon name={Icons.PlayerPlay}/>
            </MediaButtonComponent>
          )}
        <MediaButtonComponent
          className={cx('media-player-control', 'media-player-control-md')}
          disabled={!MediaPlayerService.hasNextTrack()}
          onButtonSubmit={() => {
            MediaPlayerService.playNextTrack();
          }}
        >
          <Icon name={Icons.PlayerNext}/>
        </MediaButtonComponent>
        <MediaButtonComponent
          className={cx('media-player-control', 'media-player-control-sm', 'media-player-toggle', 'media-player-repeat-toggle', {
            active: !_.isNil(mediaPlaybackQueueRepeatType),
          })}
          onButtonSubmit={() => {
            MediaPlayerService.toggleRepeat();
          }}
        >
          <Icon name={Icons.PlayerRepeat}/>
          <span className={cx('media-player-repeat-track-indicator', {
            active: mediaPlaybackQueueRepeatType === MediaEnums.MediaPlaybackRepeatType.Track,
          })}
          >
            1
          </span>
        </MediaButtonComponent>
      </Col>
    </Row>
  );
}

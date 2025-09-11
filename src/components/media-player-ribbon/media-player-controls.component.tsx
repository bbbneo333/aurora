import React, { useEffect } from 'react';
import { Col, Row } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import classNames from 'classnames/bind';
import _ from 'lodash';

import { Icons } from '../../constants';
import { RootState } from '../../reducers';
import { MediaPlayerService } from '../../services';
import { MediaEnums } from '../../enums';
import { DOM, Events } from '../../utils';

import { Icon } from '../icon/icon.component';
import { Button } from '../button/button.component';

import styles from './media-player-ribbon.component.css';

const cx = classNames.bind(styles);

export function MediaPlayerControls() {
  const {
    mediaPlaybackState,
    mediaPlaybackQueueOnShuffle,
    mediaPlaybackQueueRepeatType,
  } = useSelector((state: RootState) => state.mediaPlayer);

  const isPlaybackDisabled = mediaPlaybackState === MediaEnums.MediaPlaybackState.Loading;

  useEffect(() => {
    const handleOnKeyDown = (event: KeyboardEvent) => {
      if (
        Events.isSpaceKey(event)
        && !DOM.isElementEditable(document.activeElement)
        && !isPlaybackDisabled
      ) {
        event.preventDefault();
        MediaPlayerService.toggleMediaPlayback();
      }
    };

    window.addEventListener('keydown', handleOnKeyDown);

    return () => {
      window.removeEventListener('keydown', handleOnKeyDown);
    };
  }, [
    isPlaybackDisabled,
  ]);

  return (
    <Row className={cx('media-player-controls-container')}>
      <Col className={cx('col-12', 'media-player-controls-column')}>
        <Button
          className={cx('media-player-control', 'media-player-control-sm', 'media-player-toggle', {
            active: mediaPlaybackQueueOnShuffle,
          })}
          onButtonSubmit={() => {
            MediaPlayerService.toggleShuffle();
          }}
        >
          <Icon name={Icons.PlayerShuffle}/>
        </Button>
        <Button
          className={cx('media-player-control', 'media-player-control-md')}
          onButtonSubmit={() => {
            MediaPlayerService.playPreviousTrack();
          }}
        >
          <Icon name={Icons.PlayerPrevious}/>
        </Button>
        {mediaPlaybackState === MediaEnums.MediaPlaybackState.Playing
          ? (
            <Button
              className={cx('media-player-control', 'media-player-control-lg')}
              onButtonSubmit={() => {
                MediaPlayerService.pauseMediaPlayer();
              }}
            >
              <Icon name={Icons.PlayerPause}/>
            </Button>
          )
          : (
            <Button
              disabled={isPlaybackDisabled}
              className={cx('media-player-control', 'media-player-control-lg')}
              onButtonSubmit={() => {
                MediaPlayerService.resumeMediaPlayer();
              }}
            >
              <Icon name={Icons.PlayerPlay}/>
            </Button>
          )}
        <Button
          className={cx('media-player-control', 'media-player-control-md')}
          disabled={!MediaPlayerService.hasNextTrack()}
          onButtonSubmit={() => {
            MediaPlayerService.playNextTrack();
          }}
        >
          <Icon name={Icons.PlayerNext}/>
        </Button>
        <Button
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
        </Button>
      </Col>
    </Row>
  );
}

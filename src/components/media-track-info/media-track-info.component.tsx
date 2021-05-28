import React from 'react';
import classNames from 'classnames/bind';

import {IMediaTrack} from '../../interfaces';

import styles from './media-track-info.component.css';

const cx = classNames.bind(styles);

export function MediaTrackInfoComponent(props: {
  mediaTrack: IMediaTrack,
  infoContainerClassName?: string,
}) {
  const {
    mediaTrack,
    infoContainerClassName,
  } = props;

  return (
    <div className={cx('media-track-info-container', infoContainerClassName)}>
      <span className={cx('media-track-info-title')}>
        {mediaTrack.track_name}
      </span>
      <span className={cx('media-track-info-subtitle')}>
        {/* TODO: Add implementation for navigating to artist page when user clicks on an individual artist */}
        {mediaTrack.track_artists.join(', ')}
      </span>
    </div>
  );
}

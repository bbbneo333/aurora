import React from 'react';
import classNames from 'classnames/bind';
import {NavLink} from 'react-router-dom';

import {Routes} from '../../constants';
import {IMediaTrack} from '../../interfaces';
import {StringUtils} from '../../utils';

import styles from './media-track-info.component.css';

const cx = classNames.bind(styles);

export function MediaTrackInfoComponent(props: {
  mediaTrack: IMediaTrack,
  className?: string,
}) {
  const {
    mediaTrack,
    className,
  } = props;

  return (
    <div className={cx('media-track-info', className)}>
      <span className={cx('media-track-info-title')}>
        {mediaTrack.track_name}
      </span>
      <span className={cx('media-track-info-subtitle')}>
        {mediaTrack.track_artists.map(mediaArtist => (
          <NavLink
            exact
            key={mediaArtist.id}
            to={StringUtils.buildRouteFromMappings(Routes.LibraryArtist, {
              artistId: mediaArtist.id,
            })}
            className={cx('media-track-artist-link', 'app-nav-link')}
          >
            {mediaArtist.artist_name}
          </NavLink>
        ))}
      </span>
    </div>
  );
}

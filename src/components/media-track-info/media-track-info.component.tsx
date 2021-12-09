import React from 'react';
import classNames from 'classnames/bind';
import {NavLink} from 'react-router-dom';

import {Routes} from '../../constants';
import {IMediaArtist, IMediaTrack} from '../../interfaces';
import {StringUtils} from '../../utils';
import {withSeparator} from '../../utils/render.utils';

import styles from './media-track-info.component.css';

const cx = classNames.bind(styles);

function MediaTrackArtistLinkSeparator() {
  return (
    <span>,</span>
  );
}

export function MediaTrackArtistLinkComponent(props: {
  mediaArtist: IMediaArtist,
}) {
  const {
    mediaArtist,
  } = props;

  return (
    <NavLink
      exact
      to={StringUtils.buildRouteFromMappings(Routes.LibraryArtist, {
        artistId: mediaArtist.id,
      })}
      className={cx('media-track-artist-link', 'app-nav-link')}
    >
      {mediaArtist.artist_name}
    </NavLink>
  );
}

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
      <div className={cx('media-track-info-title')}>
        {mediaTrack.track_name}
      </div>
      <div className={cx('media-track-info-subtitle')}>
        {
          withSeparator(
            mediaTrack.track_artists,
            mediaArtist => (
              <MediaTrackArtistLinkComponent
                key={mediaArtist.id}
                mediaArtist={mediaArtist}
              />
            ),
            <MediaTrackArtistLinkSeparator/>,
          )
        }
      </div>
    </div>
  );
}

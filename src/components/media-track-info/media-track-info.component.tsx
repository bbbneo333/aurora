import React from 'react';
import classNames from 'classnames/bind';

import { Routes } from '../../constants';
import { IMediaArtist, IMediaTrack } from '../../interfaces';
import { StringUtils, withSeparator } from '../../utils';

import { RouterLink } from '../router-link/router-link.component';

import styles from './media-track-info.component.css';

const cx = classNames.bind(styles);

function MediaArtistLinkSeparator() {
  return (
    <span>,</span>
  );
}

export function MediaTrackAlbumLinkComponent(props: {
  mediaTrack: IMediaTrack,
  onContextMenu?: (e: React.MouseEvent) => void,
}) {
  const { mediaTrack, onContextMenu } = props;

  return (
    <RouterLink
      exact
      to={StringUtils.buildRoute(Routes.LibraryAlbum, {
        albumId: mediaTrack.track_album.id,
      })}
      className={cx('media-track-album-link', 'app-nav-link')}
      onContextMenu={onContextMenu}
    >
      {mediaTrack.track_name}
    </RouterLink>
  );
}

export function MediaTrackNameComponent(props: {
  mediaTrack: IMediaTrack,
  onContextMenu?: (e: React.MouseEvent) => void,
}) {
  const { mediaTrack, onContextMenu } = props;

  return (
    <div className={cx('media-track-name')} onContextMenu={onContextMenu}>
      {mediaTrack.track_name}
    </div>
  );
}

export function MediaArtistLinkComponent(props: {
  mediaArtist: IMediaArtist,
}) {
  const {
    mediaArtist,
  } = props;

  return (
    <RouterLink
      exact
      to={StringUtils.buildRoute(Routes.LibraryArtist, {
        artistId: mediaArtist.id,
      })}
      className={cx('media-track-artist-link', 'app-nav-link')}
    >
      {mediaArtist.artist_name}
    </RouterLink>
  );
}

export function MediaArtistLinksComponent(props: {
  mediaArtists: IMediaArtist[],
}) {
  const { mediaArtists } = props;

  return (
    withSeparator(
      mediaArtists,
      mediaArtist => (
        <MediaArtistLinkComponent
          key={mediaArtist.id}
          mediaArtist={mediaArtist}
        />
      ),
      <MediaArtistLinkSeparator/>,
    )
  );
}

export function MediaTrackInfoComponent(props: {
  mediaTrack: IMediaTrack,
  disableAlbumLink?: boolean,
  className?: string,
  onContextMenu?: (e: React.MouseEvent) => void,
}) {
  const {
    mediaTrack,
    disableAlbumLink = false,
    className,
    onContextMenu,
  } = props;

  return (
    <div className={cx('media-track-info', className)}>
      <div className={cx('media-track-info-title')}>
        {
          disableAlbumLink
            ? (
              <MediaTrackNameComponent
                mediaTrack={mediaTrack}
                onContextMenu={onContextMenu}
              />
            )
            : (
              <MediaTrackAlbumLinkComponent
                mediaTrack={mediaTrack}
                onContextMenu={onContextMenu}
              />
            )
        }
      </div>
      <div className={cx('media-track-info-subtitle')}>
        <MediaArtistLinksComponent mediaArtists={mediaTrack.track_artists}/>
      </div>
    </div>
  );
}

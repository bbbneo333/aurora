import React from 'react';
import classNames from 'classnames/bind';

import { Routes } from '../../constants';
import { IMediaArtist, IMediaTrack } from '../../interfaces';
import { StringUtils, withSeparator } from '../../utils';

import { RouterLink } from '../router-link/router-link.component';
import { Text, TextProps } from '../text/text.component';
import { TextMarquee, TextMarqueeProps } from '../text/text-marquee.component';

import styles from './media-track-info.component.css';

const cx = classNames.bind(styles);

function MediaArtistLinkSeparator() {
  return (
    <span>,</span>
  );
}

function MediaText(props: {
  marquee?: boolean;
} & (TextProps | TextMarqueeProps)) {
  const { marquee, ...rest } = props;

  if (marquee) {
    return (
      <TextMarquee {...rest}/>
    );
  }

  return (
    <Text {...rest}/>
  );
}

export function MediaTrackAlbumLink(props: {
  mediaTrack: IMediaTrack;
  onContextMenu?: (e: React.MouseEvent) => void;
  marquee?: boolean;
}) {
  const { mediaTrack, onContextMenu, marquee } = props;

  return (
    <RouterLink
      exact
      to={StringUtils.buildRoute(Routes.LibraryAlbum, {
        albumId: mediaTrack.track_album.id,
      })}
      className={cx('media-track-album-link', 'app-nav-link')}
      onContextMenu={onContextMenu}
    >
      <MediaText marquee={marquee}>
        {mediaTrack.track_name}
      </MediaText>
    </RouterLink>
  );
}

export function MediaTrackName(props: {
  mediaTrack: IMediaTrack;
  onContextMenu?: (e: React.MouseEvent) => void;
  marquee?: boolean;
}) {
  const { mediaTrack, onContextMenu, marquee } = props;

  return (
    <div className={cx('media-track-name')} onContextMenu={onContextMenu}>
      <MediaText marquee={marquee}>
        {mediaTrack.track_name}
      </MediaText>
    </div>
  );
}

export function MediaArtistLink(props: {
  mediaArtist: IMediaArtist;
  marquee?: boolean;
}) {
  const { mediaArtist, marquee } = props;

  return (
    <RouterLink
      exact
      to={StringUtils.buildRoute(Routes.LibraryArtist, {
        artistId: mediaArtist.id,
      })}
      className={cx('media-track-artist-link', 'app-nav-link')}
    >
      <MediaText marquee={marquee}>
        {mediaArtist.artist_name}
      </MediaText>
    </RouterLink>
  );
}

export function MediaArtistLinks(props: {
  mediaArtists: IMediaArtist[];
  marquee?: boolean;
}) {
  const { mediaArtists, marquee } = props;

  return (
    withSeparator(
      mediaArtists,
      mediaArtist => (
        <MediaArtistLink
          key={mediaArtist.id}
          mediaArtist={mediaArtist}
          marquee={marquee}
        />
      ),
      <MediaArtistLinkSeparator/>,
    )
  );
}

export function MediaTrackInfo(props: {
  mediaTrack: IMediaTrack;
  disableAlbumLink?: boolean;
  className?: string;
  onContextMenu?: (e: React.MouseEvent) => void;
  marquee?: boolean;
}) {
  const {
    mediaTrack,
    disableAlbumLink = false,
    className,
    onContextMenu,
    marquee,
  } = props;

  return (
    <div className={cx('media-track-info', className)}>
      <div className={cx('media-track-info-title')}>
        {
          disableAlbumLink
            ? (
              <MediaTrackName
                marquee={marquee}
                mediaTrack={mediaTrack}
                onContextMenu={onContextMenu}
              />
            )
            : (
              <MediaTrackAlbumLink
                marquee={marquee}
                mediaTrack={mediaTrack}
                onContextMenu={onContextMenu}
              />
            )
        }
      </div>
      <div className={cx('media-track-info-subtitle')}>
        <MediaArtistLinks
          marquee={marquee}
          mediaArtists={mediaTrack.track_artists}
        />
      </div>
    </div>
  );
}

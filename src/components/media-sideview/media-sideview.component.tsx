import React, { useEffect, useState } from 'react';
import classNames from 'classnames/bind';
import { isEmpty } from 'lodash';
import { useSelector } from 'react-redux';
import { Icons } from '../../constants';
import {
  IMediaAlbum,
  IMediaPlaylist,
  IMediaPlaylistTrack,
  IMediaTrack,
} from '../../interfaces';
import { RootState } from '../../reducers';
import {
  MediaAlbumService,
  MediaCollectionService,
  MediaPlaylistService,
  MediaTrackService,
} from '../../services';
import { Icon } from '../icon/icon.component';
import { MediaCollectionActions } from '../media-collection-actions/media-collection-actions.component';
import { MediaCoverPicture } from '../media-cover-picture/media-cover-picture.component';
import { MediaTrackList } from '../media-track-list/media-track-list.component';
import styles from './media-sideview.component.css';

const cx = classNames.bind(styles);

type MediaSideViewAlbumProps = {
  albumId: string;
  onClose: () => void;
};

type MediaSideViewPlaylistProps = {
  playlistId: string;
  onClose: () => void;
};

function getAlbumDisplayTitle(albumName?: string, artistName?: string) {
  if (!artistName || !albumName) {
    return albumName;
  }

  const artistPrefix = `${artistName} - `;
  if (albumName.startsWith(artistPrefix)) {
    return albumName.substring(artistPrefix.length);
  }

  return albumName;
}

export function MediaAlbumSideView({ albumId, onClose }: MediaSideViewAlbumProps) {
  const [loadedAlbum, setLoadedAlbum] = useState<IMediaAlbum | undefined>();
  const [tracks, setTracks] = useState<IMediaTrack[]>([]);
  const mediaAlbums = useSelector((state: RootState) => state.mediaLibrary.mediaAlbums);
  const album = mediaAlbums.find(mediaAlbum => mediaAlbum.id === albumId) || loadedAlbum;

  useEffect(() => {
    MediaAlbumService.getMediaAlbum(albumId).then(setLoadedAlbum);
    MediaTrackService.getMediaAlbumTracks(albumId).then(setTracks);

    document.body.classList.add('sideview-open');
    return () => {
      document.body.classList.remove('sideview-open');
    };
  }, [albumId]);

  if (!album) {
    return null;
  }

  const albumDisplayTitle = getAlbumDisplayTitle(album.album_name, album.album_artist?.artist_name);

  return (
    <>
      <div
        className={cx('sideview-backdrop')}
        role="button"
        tabIndex={0}
        aria-label="Sideview schließen"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onClose();
          if (e.key === 'Escape') onClose();
        }}
      />
      <aside className={cx('sideview')}>
        <div className={cx('sideview-header')}>
          <div className={cx('sideview-title')}>
            {albumDisplayTitle}
          </div>
          <button type="button" className={cx('sideview-close')} onClick={onClose} title="Close">
            <Icon name={Icons.Close}/>
          </button>
        </div>
        <div className={cx('sideview-cover')}>
          <MediaCoverPicture
            mediaPicture={album.album_cover_picture}
            mediaPictureAltText={album.album_name}
            className={cx('sideview-cover-picture')}
          />
          <div className={cx('sideview-meta')}>
            <div className={cx('sideview-meta-title')}>{albumDisplayTitle}</div>
            <div className={cx('sideview-meta-artist')}>{album.album_artist.artist_name}</div>
            <div className={cx('sideview-meta-details')}>
              {album.album_year ? <span>{album.album_year}</span> : null}
              {album.album_year && album.album_genre ? <span> • </span> : null}
              {album.album_genre ? <span>{album.album_genre}</span> : null}
            </div>
          </div>
        </div>
        <div className={cx('sideview-actions')}>
          <MediaCollectionActions
            mediaItem={MediaCollectionService.getMediaItemFromAlbum(album)}
            hasTracks={!isEmpty(tracks)}
          />
        </div>
        {!isEmpty(tracks) && (
          <div className={cx('sideview-tracklist')}>
            <MediaTrackList
              mediaTracks={tracks}
              mediaTrackList={{ id: album.id }}
              disableCovers
              disableAlbumLinks
              variant="sideview"
            />
          </div>
        )}
      </aside>
    </>
  );
}

export function MediaPlaylistSideView({ playlistId, onClose }: MediaSideViewPlaylistProps) {
  const [playlist, setPlaylist] = useState<IMediaPlaylist | undefined>();
  const [tracks, setTracks] = useState<IMediaPlaylistTrack[]>([]);

  useEffect(() => {
    MediaPlaylistService.getMediaPlaylist(playlistId).then(setPlaylist);
    MediaPlaylistService.resolveMediaPlaylistTracks(playlistId).then(setTracks);

    document.body.classList.add('sideview-open');
    return () => {
      document.body.classList.remove('sideview-open');
    };
  }, [playlistId]);

  if (!playlist) {
    return null;
  }

  return (
    <>
      <div
        className={cx('sideview-backdrop')}
        role="button"
        tabIndex={0}
        aria-label="Sideview schließen"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onClose();
          if (e.key === 'Escape') onClose();
        }}
      />
      <aside className={cx('sideview')}>
        <div className={cx('sideview-header')}>
          <div className={cx('sideview-title')}>
            {playlist.name}
          </div>
          <button type="button" className={cx('sideview-close')} onClick={onClose} title="Close">
            <Icon name={Icons.Close}/>
          </button>
        </div>
        <div className={cx('sideview-cover')}>
          <MediaCoverPicture
            mediaPicture={playlist.cover_picture}
            mediaPictureAltText={playlist.name}
            className={cx('sideview-cover-picture')}
          />
          <div className={cx('sideview-meta')}>
            <div className={cx('sideview-meta-title')}>{playlist.name}</div>
            <div className={cx('sideview-meta-details')}>
              {playlist.tracks.length}
              {' '}
              Tracks
            </div>
          </div>
        </div>
        {!isEmpty(tracks) && (
          <div className={cx('sideview-tracklist')}>
            <MediaTrackList
              mediaTracks={tracks}
              mediaTrackList={{ id: playlist.id }}
              getMediaTrackId={t => t.playlist_track_id}
              disableCovers
              variant="sideview"
            />
          </div>
        )}
      </aside>
    </>
  );
}

import React, { useEffect } from 'react';
import classNames from 'classnames/bind';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';

import {
  MediaCoverPicture,
  MediaArtistLinkComponent,
  MediaTracks,
  MediaTrackContextMenuItem,
  MediaCollectionActions,
} from '../../components';

import { Layout } from '../../constants';
import { RootState } from '../../reducers';
import { I18nService, MediaLibraryService } from '../../services';
import { MediaUtils } from '../../utils';

import styles from './album.component.css';

const cx = classNames.bind(styles);

export function AlbumPage() {
  const {
    albumId,
  } = useParams() as { albumId: string };

  const {
    mediaSelectedAlbum,
    mediaSelectedAlbumTracks,
  } = useSelector((state: RootState) => state.mediaLibrary);

  useEffect(() => {
    MediaLibraryService.loadMediaAlbum(albumId);
  }, [
    albumId,
  ]);

  if (!mediaSelectedAlbum || !mediaSelectedAlbumTracks) {
    return (<></>);
  }

  return (
    <div className="container-fluid">
      <div className={cx('album-header')}>
        <div className="row">
          <div className={cx(Layout.Grid.CollectionHeaderCoverColumn, 'album-header-cover-column')}>
            <MediaCoverPicture
              mediaPicture={mediaSelectedAlbum.album_cover_picture}
              mediaPictureAltText={mediaSelectedAlbum.album_name}
              className={cx('album-cover-picture')}
            />
          </div>
          <div className={cx(Layout.Grid.CollectionHeaderInfoColumn, 'album-header-info-column')}>
            <div className={cx('album-header-label')}>
              {I18nService.getString('label_album_header')}
            </div>
            <div className={cx('album-header-name')}>
              {mediaSelectedAlbum.album_name}
            </div>
            <div className={cx('album-header-info')}>
              <MediaArtistLinkComponent mediaArtist={mediaSelectedAlbum.album_artist}/>
            </div>
          </div>
        </div>
      </div>
      <div className={cx('album-actions')}>
        <MediaCollectionActions mediaItem={MediaUtils.getMediaItemFromAlbum(mediaSelectedAlbum)}/>
      </div>
      <div className={cx('album-tracklist')}>
        <MediaTracks
          mediaTracks={mediaSelectedAlbumTracks}
          mediaTrackList={{
            id: mediaSelectedAlbum.id,
          }}
          contextMenuItems={[
            MediaTrackContextMenuItem.AddToQueue,
            MediaTrackContextMenuItem.Separator,
            MediaTrackContextMenuItem.AddToPlaylist,
          ]}
          disableCovers
          disableAlbumLinks
        />
      </div>
    </div>
  );
}

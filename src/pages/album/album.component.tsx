import React, { useEffect } from 'react';
import classNames from 'classnames/bind';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { isEmpty } from 'lodash';

import {
  MediaCoverPicture,
  MediaArtistLink,
  MediaTrackList,
  MediaTrackContextMenuItem,
  MediaCollectionActions,
  MediaAlbumEditModal,
  TextClamp,
  Button,
  Icon,
} from '../../components';

import { useModal } from '../../contexts';
import {
  I18nService,
  MediaAlbumService,
  MediaCollectionService,
  MediaTrackService,
} from '../../services';

import { Icons } from '../../constants';
import { RootState } from '../../reducers';

import styles from './album.component.css';

const cx = classNames.bind(styles);

export function AlbumPage() {
  const { albumId } = useParams() as { albumId: string };
  const { showModal } = useModal();
  const mediaSelectedAlbum = useSelector((state: RootState) => state.mediaLibrary.mediaSelectedAlbum);
  const mediaSelectedAlbumTracks = useSelector((state: RootState) => state.mediaLibrary.mediaSelectedAlbumTracks);

  useEffect(() => {
    MediaTrackService.loadMediaAlbumTracks(albumId);

    return () => MediaAlbumService.unloadMediaAlbum();
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
          <div className={cx('col-auto', 'album-header-cover-column')}>
            <MediaCoverPicture
              mediaPicture={mediaSelectedAlbum.album_cover_picture}
              mediaPictureAltText={mediaSelectedAlbum.album_name}
              mediaCoverPlaceholderIcon={Icons.AlbumPlaceholder}
              className={cx('album-cover-picture')}
            />
          </div>
          <div className={cx('col', 'album-header-info-column')}>
            <div className={cx('album-header-label')}>
              {I18nService.getString('label_album_header')}
            </div>
            <div className={cx('album-header-name')}>
              <TextClamp>
                {mediaSelectedAlbum.album_name}
              </TextClamp>
            </div>
            <div className={cx('album-header-artist')}>
              <MediaArtistLink mediaArtist={mediaSelectedAlbum.album_artist}/>
            </div>
            {mediaSelectedAlbum.album_genre && (
              <div className={cx('album-header-genres')}>
                {mediaSelectedAlbum.album_genre.split(',').map(genre => (
                  <span key={genre} className={cx('album-genre-chip')}>
                    {genre.trim()}
                  </span>
                ))}
              </div>
            )}
            <div className={cx('album-header-actions')}>
              <Button
                variant={['rounded', 'outline']}
                tooltip={I18nService.getString('tooltip_edit_album')}
                onButtonSubmit={() => {
                  showModal(MediaAlbumEditModal, {
                    mediaAlbumId: mediaSelectedAlbum.id,
                  }, {
                    onComplete: (result) => {
                      if (!result?.updatedAlbum) {
                        return;
                      }

                      MediaTrackService.loadMediaAlbumTracks(result.updatedAlbum.id);
                    },
                  });
                }}
              >
                <Icon name={Icons.Edit}/>
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className={cx('album-actions')}>
        <MediaCollectionActions
          mediaItem={MediaCollectionService.getMediaItemFromAlbum(mediaSelectedAlbum)}
          hasTracks={!isEmpty(mediaSelectedAlbumTracks)}
        />
      </div>
      <div className={cx('album-tracklist')}>
        <MediaTrackList
          mediaTracks={mediaSelectedAlbumTracks}
          mediaTrackList={{
            id: mediaSelectedAlbum.id,
          }}
          contextMenuItems={[
            MediaTrackContextMenuItem.Like,
            MediaTrackContextMenuItem.AddToQueue,
            MediaTrackContextMenuItem.AddToPlaylist,
          ]}
          disableCovers
          disableAlbumLinks
        />
      </div>
    </div>
  );
}

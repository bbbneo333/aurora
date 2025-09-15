import React, { useCallback, useEffect } from 'react';
import classNames from 'classnames/bind';
import { useSelector } from 'react-redux';
import { isEmpty, values } from 'lodash';

import { I18nService, MediaCollectionService, MediaLibraryLikedTrackService } from '../../services';
import { Layout } from '../../constants';
import { useModal } from '../../contexts';
import { RootState } from '../../reducers';
import { MediaUtils } from '../../utils';

import {
  MediaCollectionActions,
  MediaCoverPicture,
  MediaTrackContextMenuItem,
  MediaTrackList,
  MediaLikedTracksDeleteModal,
} from '../../components';

import styles from '../playlist/playlist.component.css';

const cx = classNames.bind(styles);

const likesCollectionItem = MediaCollectionService.getMediaItemForLikedTracks();

export function LikedTracksPage() {
  const mediaLikedTracks = useSelector((state: RootState) => state.mediaLibrary.mediaLikedTracks);
  const { showModal } = useModal();

  const handleSelectionDelete = useCallback((likedTracksIds: string[]) => new Promise<boolean>((resolve) => {
    showModal(MediaLikedTracksDeleteModal, {
      likedTracksIds,
    }, {
      onComplete: (res) => {
        // success signal if selected were deleted
        resolve(!isEmpty(res?.deletedLikedTrackIds));
      },
    });
  }), [
    showModal,
  ]);

  useEffect(() => {
    MediaLibraryLikedTrackService.loadLikedTracks();
  }, []);

  return (
    <div className="container-fluid">
      <div className={cx('playlist-header')}>
        <div className="row">
          <div className={cx(Layout.Grid.CollectionHeaderCoverColumn, 'playlist-header-cover-column')}>
            <MediaCoverPicture
              mediaPicture={likesCollectionItem.picture}
              mediaPictureAltText={likesCollectionItem.name}
              mediaCoverPlaceholderIcon={MediaCollectionService.getCoverPlaceholderIcon(likesCollectionItem)}
              className={cx('playlist-cover-picture')}
            />
          </div>
          <div className={cx(Layout.Grid.CollectionHeaderInfoColumn, 'playlist-header-info-column')}>
            <div className={cx('playlist-header-label')}>
              {I18nService.getString('label_playlist_header')}
            </div>
            <div className={cx('playlist-header-name')}>
              {likesCollectionItem.name}
            </div>
          </div>
        </div>
      </div>
      <div className={cx('playlist-actions')}>
        <MediaCollectionActions
          mediaItem={likesCollectionItem}
          hasTracks={!isEmpty(mediaLikedTracks)}
        />
      </div>
      {isEmpty(mediaLikedTracks) && (
        <div className="row">
          <div className="col-12">
            <div className={cx('playlist-empty-section')}>
              <div className={cx('playlist-empty-label')}>
                {I18nService.getString('label_playlist_empty')}
              </div>
            </div>
          </div>
        </div>
      )}
      {!isEmpty(mediaLikedTracks) && (
        <div className={cx('playlist-tracklist')}>
          <MediaTrackList
            mediaTracks={MediaUtils.sortMediaLikedTracks(values(mediaLikedTracks))}
            mediaTrackList={{
              id: likesCollectionItem.id,
            }}
            contextMenuItems={[
              MediaTrackContextMenuItem.Like,
              MediaTrackContextMenuItem.AddToQueue,
            ]}
            onSelectionDelete={handleSelectionDelete}
          />
        </div>
      )}
    </div>
  );
}

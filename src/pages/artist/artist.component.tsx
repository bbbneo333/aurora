import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { isEmpty } from 'lodash';
import classNames from 'classnames/bind';

import { Icons, Layout } from '../../constants';
import { MediaAlbums, MediaCollectionActions, MediaCoverPicture } from '../../components';
import { RootState } from '../../reducers';
import { I18nService, MediaCollectionService, MediaLibraryService } from '../../services';

import styles from './artist.component.css';

const cx = classNames.bind(styles);

export function ArtistPage() {
  const { artistId } = useParams() as { artistId: string };

  const mediaSelectedArtist = useSelector((state: RootState) => state.mediaLibrary.mediaSelectedArtist);
  const mediaSelectedArtistAlbums = useSelector((state: RootState) => state.mediaLibrary.mediaSelectedArtistAlbums);

  useEffect(() => {
    MediaLibraryService.loadMediaArtist(artistId);
  }, [
    artistId,
  ]);

  if (!mediaSelectedArtist || !mediaSelectedArtistAlbums || isEmpty(mediaSelectedArtistAlbums)) {
    return (<></>);
  }

  return (
    <div className="container-fluid">
      <div className={cx('artist-header')}>
        <div className="row">
          <div className={cx(Layout.Grid.CollectionHeaderCoverColumn, 'artist-header-cover-column')}>
            <MediaCoverPicture
              mediaPicture={mediaSelectedArtist.artist_feature_picture}
              mediaPictureAltText={mediaSelectedArtist.artist_name}
              mediaCoverPlaceholderIcon={Icons.ArtistPlaceholder}
              className={cx('artist-cover-picture')}
            />
          </div>
          <div className={cx(Layout.Grid.CollectionHeaderInfoColumn, 'artist-header-info-column')}>
            <div className={cx('artist-header-label')}>
              {I18nService.getString('label_artist_header')}
            </div>
            <div className={cx('artist-header-name')}>
              {mediaSelectedArtist.artist_name}
            </div>
            <div className={cx('artist-header-info')}/>
          </div>
        </div>
      </div>
      <div className={cx('artist-actions')}>
        <MediaCollectionActions
          mediaItem={MediaCollectionService.getMediaItemFromArtist(mediaSelectedArtist)}
        />
      </div>
      <div className={cx('artist-albums')}>
        <MediaAlbums mediaAlbums={mediaSelectedArtistAlbums}/>
      </div>
    </div>
  );
}

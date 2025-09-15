import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { isEmpty } from 'lodash';
import classNames from 'classnames/bind';
import { useHistory } from 'react-router-dom';

import { Icons, Routes } from '../../constants';
import { RootState } from '../../reducers';
import { I18nService, MediaPlaylistService } from '../../services';
import { StringUtils } from '../../utils';

import {
  Button,
  MediaPlaylists,
  MediaLikedTracksCollectionItem,
} from '../../components';

import styles from './playlists.component.css';

const cx = classNames.bind(styles);

export function PlaylistsPage() {
  const mediaPlaylists = useSelector((state: RootState) => state.mediaLibrary.mediaPlaylists);
  const history = useHistory();

  useEffect(() => {
    MediaPlaylistService.loadMediaPlaylists();
  }, []);

  return (
    <div className="container-fluid">
      {isEmpty(mediaPlaylists) && (
        <div className="row">
          <div className="col-12">
            <div className={cx('playlists-empty-section')}>
              <div className={cx('playlists-empty-label')}>
                {I18nService.getString('label_playlists_empty')}
              </div>
              <div className={cx('playlists-empty-create-button')}>
                <Button
                  icon={Icons.AddCircle}
                  onButtonSubmit={() => {
                    MediaPlaylistService.createMediaPlaylist().then((mediaPlaylist) => {
                      const pathToPlaylist = StringUtils.buildRoute(Routes.LibraryPlaylist, {
                        playlistId: mediaPlaylist.id,
                      });

                      history.push(pathToPlaylist);
                    });
                  }}
                >
                  {I18nService.getString('button_create_playlist')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className={cx('playlist-liked-tracks')}>
        <MediaLikedTracksCollectionItem/>
      </div>
      <MediaPlaylists mediaPlaylists={mediaPlaylists}/>
    </div>
  );
}

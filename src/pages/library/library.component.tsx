import React, { useEffect, useState } from 'react';
import classNames from 'classnames/bind';
import { useSelector } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';

import {
  Button,
  Icon,
  MediaHeaderNavigationLink,
  MediaPlaylistWizardModal,
  RouterSwitchComponent,
} from '../../components';
import { useModal } from '../../contexts';
import { Icons, Routes } from '../../constants';
import { selectSortedPlaylists } from '../../selectors';
import { I18nService, MediaPlaylistService } from '../../services';
import { StringUtils } from '../../utils';

import styles from './library.component.css';
import routes from './library.routes';

const cx = classNames.bind(styles);

export function LibraryPage() {
  return (
    <div className={cx('library-content-browser-container')}>
      <RouterSwitchComponent routes={routes}/>
    </div>
  );
}

export function LibraryHeader() {
  const [hideArtist, setHideArtist] = useState(false);
  const mediaPlaylists = useSelector(selectSortedPlaylists);
  const { showModal } = useModal();
  const history = useHistory();
  const location = useLocation();
  const isPlaylistModule = location.pathname.startsWith(`${Routes.LibraryPlaylists}`);

  useEffect(() => {
    const checkSettings = () => {
      const saved = localStorage.getItem('aurora:ui-settings');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setHideArtist(!!parsed.hideArtist);
        } catch (e) {
          // ignore
        }
      } else {
        setHideArtist(false);
      }
    };

    checkSettings();
    window.addEventListener('aurora:settings-changed', checkSettings);
    return () => window.removeEventListener('aurora:settings-changed', checkSettings);
  }, []);

  useEffect(() => {
    MediaPlaylistService.loadMediaPlaylists();
  }, []);

  return (
    <div className={cx('library-header')}>
      <div className={cx('library-header-navigation-list')}>
        {routes.map((route) => {
          if (!route.tHeaderName) return null;
          if (hideArtist && route.path === Routes.LibraryArtists) return null;

          return (
            <MediaHeaderNavigationLink
              key={route.path}
              tName={route.tHeaderName}
              path={route.path}
            />
          );
        })}
      </div>
      <div className={cx('library-header-controls')}>
        <div id="library-header-controls" className={cx('library-header-controls-slot')}/>
        {isPlaylistModule && mediaPlaylists.length > 0 && (
          <Button
            className={cx('library-playlist-add-button')}
            variant={['rounded', 'primary']}
            tooltip={I18nService.getString('button_create_playlist')}
            onButtonSubmit={() => {
              showModal(MediaPlaylistWizardModal, {}, {
                onComplete: (result) => {
                  if (!result?.createdPlaylist) {
                    return;
                  }

                  history.push(StringUtils.buildRoute(Routes.LibraryPlaylist, {
                    playlistId: result.createdPlaylist.id,
                  }));
                },
              });
            }}
          >
            <Icon className={cx('library-playlist-add-icon')} name={Icons.Add}/>
          </Button>
        )}
      </div>
    </div>
  );
}

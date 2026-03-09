import React, { useCallback, useSyncExternalStore, useState } from 'react';
import classNames from 'classnames/bind';
import { useDispatch, useSelector } from 'react-redux';

import {
  Button,
  Icon,
  MediaPinnedItemList,
  RouterLink,
} from '../../components';

import { AppService, I18nService, PodcastService } from '../../services';
import routes from '../app.routes';
import { Icons, Routes } from '../../constants';
import { MediaLibraryActions } from '../../enums';
import { PlatformOS } from '../../modules/platform';
import { IPCCommChannel, IPCRenderer } from '../../modules/ipc';
import { RootState } from '../../reducers';

// @ts-ignore
import AppLogo from '../../../assets/icons/icon.png';

import styles from './sidebar.component.css';

const cx = classNames.bind(styles);

function SidebarQuickAccess() {
  return (
    <div className={cx('sidebar-quick-access', 'app-scrollable')}>
      <MediaPinnedItemList/>
    </div>
  );
}

function SidebarBrandingLogo() {
  return (
    <div className={cx('sidebar-branding')}>
      <div className={cx('sidebar-logo')} style={{ backgroundImage: `url(${AppLogo})` }}/>
      <div className={cx('sidebar-app-name')}>{AppService.details.display_name}</div>
    </div>
  );
}

function SidebarNavigationLink(props: {
  route: {
    path: string,
    icon: string,
    name: string,
  },
  hasNewContent?: boolean,
}) {
  const {
    route: {
      icon,
      name,
      path,
    },
    hasNewContent = false,
  } = props;

  return (
    <RouterLink
      to={path}
      activeClassName={cx('active')}
      className={cx('sidebar-navigation-item', 'app-nav-link')}
    >
      <span className={cx('sidebar-navigation-item-icon')}>
        <Icon name={icon}/>
      </span>
      <span className={cx('sidebar-navigation-item-label')}>
        {hasNewContent && <span className={cx('sidebar-item-new-dot')}/>}
        {I18nService.getString(name)}
      </span>
    </RouterLink>
  );
}

function SidebarAudioCd() {
  const dispatch = useDispatch();
  const audioCd = useSelector((state: RootState) => state.mediaLibrary.audioCd);
  const [isEjecting, setIsEjecting] = useState(false);

  const handleEject = useCallback((event?: MouseEvent | KeyboardEvent) => {
    event?.stopPropagation();
    event?.preventDefault();
    if (isEjecting) {
      return;
    }

    setIsEjecting(true);
    IPCRenderer.sendAsyncMessage(IPCCommChannel.DeviceEjectAudioCd)
      .catch(() => {})
      .finally(() => {
        const status = IPCRenderer.sendSyncMessage(IPCCommChannel.DeviceGetAudioCdStatus);
        dispatch({
          type: MediaLibraryActions.SetAudioCd,
          data: status,
        });
        setIsEjecting(false);
      });
  }, [dispatch, isEjecting]);

  if (!audioCd?.present) return null;

  return (
    <div className={cx('sidebar-navigation-item-group')}>
      <RouterLink
        to="/audio-cd"
        activeClassName={cx('active')}
        className={cx('sidebar-navigation-item', 'app-nav-link')}
      >
        <span className={cx('sidebar-navigation-item-icon')}>
          <Icon name={Icons.AlbumPlaceholder}/>
        </span>
        <span className={cx('sidebar-navigation-item-label')}>
          {audioCd.name || 'Audio CD'}
        </span>
      </RouterLink>
      <Button
        className={cx('sidebar-cd-eject-button')}
        tooltip="CD auswerfen"
        disabled={isEjecting}
        onButtonSubmit={handleEject}
      >
        <Icon name={Icons.Eject}/>
      </Button>
    </div>
  );
}

function SidebarNavigationList() {
  const hasPodcastUpdates = useSyncExternalStore(
    listener => PodcastService.subscribe(listener),
    () => PodcastService.hasNewEpisodes(),
    () => PodcastService.hasNewEpisodes(),
  );

  return (
    <div className={cx('sidebar-navigation-list')}>
      {routes.sidebar.map(route => (
        <SidebarNavigationLink
          key={route.path}
          route={route}
          hasNewContent={route.path === Routes.Podcasts && hasPodcastUpdates}
        />
      ))}
      <SidebarAudioCd/>
    </div>
  );
}

function SidebarHeader() {
  return (
    <div className={cx('sidebar-header', 'app-window-drag')}>
      {AppService.details.platform !== PlatformOS.Darwin && (
        <Button
          icon={Icons.Menu}
          onButtonSubmit={() => {
            IPCRenderer.sendSyncMessage(IPCCommChannel.AppOpenMenu);
          }}
        />
      )}
    </div>
  );
}

function SidebarContent() {
  return (
    <div className={cx('sidebar-content')}>
      <SidebarBrandingLogo/>
      <SidebarNavigationList/>
      <SidebarQuickAccess/>
    </div>
  );
}

export function Sidebar() {
  return (
    <div className={cx('sidebar')}>
      {/* TODO: Add back SidebarBrandingLogo when required */}
      {/* <SidebarBrandingLogo/> */}
      <SidebarHeader/>
      <SidebarContent/>
    </div>
  );
}

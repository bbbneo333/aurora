import React from 'react';
import classNames from 'classnames/bind';
import {useSelector} from 'react-redux';
import {HashRouter as Router, NavLink} from 'react-router-dom';

import {RouterSwitchComponent} from './components';
import {MediaLocalProvider} from './providers';
import {RootState} from './reducers';
import {I18nService, MediaProviderService} from './services';

import * as AppComponents from './components';

import './app.global.css';
import styles from './app.component.css';
import routes from './app.routes';

const cx = classNames.bind(styles);

// register media providers
const mediaLocalProvider = new MediaLocalProvider();
MediaProviderService.registerMediaProvider(mediaLocalProvider);

// app > stage > content > header > rows [navigator, page header, user]

function AppContentHeaderPage() {
  return (
    <div className={cx('app-content-header-page-container')}>
      <RouterSwitchComponent routes={routes.header}/>
    </div>
  );
}

// app > stage > content > columns [header, browser]

function AppContentHeader() {
  return (
    <div className={cx('app-content-header-container')}>
      <AppComponents.MediaContentHeaderNavigatorComponent/>
      <AppContentHeaderPage/>
      {/* TODO: Add back MediaContentHeaderUserComponent once implemented */}
      {/* <AppComponents.MediaContentHeaderUserComponent/> */}
    </div>
  );
}

function AppContentBrowser() {
  return (
    <div className={cx('app-content-browser-container', 'app-scrollable')}>
      <RouterSwitchComponent routes={routes.main}/>
    </div>
  );
}

// app > stage > sidebar

function AppSidebarQuickAccess() {
  return (
    <div className={cx('app-sidebar-quick-access', 'app-scrollable')}/>
  );
}

function AppSidebarNavigationLink(props: {
  route: {
    path: string,
    fSidebarLinkIcon: string,
    tSidebarLinkName: string,
  }
}) {
  const {route} = props;

  return (
    <NavLink
      to={route.path}
      activeClassName={cx('selected')}
      className={cx('app-sidebar-navigation-item', 'app-nav-link')}
    >
      <span className={cx('app-sidebar-navigation-item-icon')}>
        <i className={route.fSidebarLinkIcon}/>
      </span>
      <span className={cx('app-sidebar-navigation-item-label')}>
        {I18nService.getString(route.tSidebarLinkName)}
      </span>
    </NavLink>
  );
}

function AppSidebarNavigationList() {
  return (
    <div className={cx('app-sidebar-navigation-list')}>
      {routes.sidebar.map(route => (
        <AppSidebarNavigationLink key={route.path} route={route}/>
      ))}
    </div>
  );
}

function AppSidebarBrandingLogo() {
  return (
    // TODO: Add app logo / branding here
    // <div className={cx('app-sidebar-logo')}/>
    <></>
  );
}

// app > stage > rows [sidebar, content]

function AppSidebar() {
  return (
    <div className={cx('app-sidebar-container')}>
      <AppSidebarBrandingLogo/>
      <AppSidebarNavigationList/>
      <AppSidebarQuickAccess/>
    </div>
  );
}

function AppContent() {
  return (
    <div className={cx('app-content-container')}>
      <AppContentHeader/>
      <AppContentBrowser/>
    </div>
  );
}

// app > stage

function AppStage() {
  return (
    <div className={cx('app-stage-container')}>
      <AppSidebar/>
      <AppContent/>
    </div>
  );
}

// app > media player

function AppMediaPlayer() {
  const mediaPlayer = useSelector((state: RootState) => state.mediaPlayer);

  return (
    <div className={cx('app-media-player-container', {
      active: !!mediaPlayer.mediaPlaybackCurrentMediaTrack,
    })}
    >
      <AppComponents.MediaSessionComponent/>
      <AppComponents.MediaPlayerRibbonComponent/>
    </div>
  );
}

// app > columns [stage, media player]

export function AppComponent() {
  return (
    <Router>
      <div className={cx('app-container')}>
        <AppStage/>
        <AppMediaPlayer/>
      </div>
    </Router>
  );
}

import React from 'react';
import classNames from 'classnames/bind';
import {useSelector} from 'react-redux';

import {
  Route,
  HashRouter as Router,
  Switch,
  NavLink,
} from 'react-router-dom';

import {MediaLocalProvider} from './providers';
import {RootState} from './reducers';
import {I18nService, MediaProviderService} from './services';

import * as AppComponents from './components';

import './app.global.css';
import styles from './app.component.css';
import routes, {AppRoute} from './app.routes';

const cx = classNames.bind(styles);

// register media providers
const mediaLocalProvider = new MediaLocalProvider();
MediaProviderService.registerMediaProvider(mediaLocalProvider);

// app > stage > content > header > rows [navigator, page header, user]

function AppContentHeaderPage() {
  return (
    <div className={cx('app-content-header-page-container')}>
      <Switch>
        {routes.map(route => route.header && (
          <Route
            key={`route-${route.path}`}
            path={route.path}
          >
            {
              React.createElement(route.header, {
                key: `route-${route.path}`,
              })
            }
          </Route>
        ))}
      </Switch>
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
    <div className={cx('app-content-browser-container', 'scrollable')}>
      <Switch>
        {routes.map(route => (
          <Route
            key={`route-${route.path}`}
            path={route.path}
          >
            {
              React.createElement(route.main, {
                key: `route-${route.path}`,
              })
            }
          </Route>
        ))}
      </Switch>
    </div>
  );
}

// app > stage > sidebar

function AppSidebarNavigationLink(props: {route: AppRoute}) {
  const {route} = props;

  return (
    <NavLink
      exact
      to={route.path}
      activeClassName={cx('selected')}
      className={cx('app-sidebar-navigation-item')}
    >
      <span className={cx('app-sidebar-navigation-item-icon')}>
        <i className={route.fIcon}/>
      </span>
      <span className={cx('app-sidebar-navigation-item-label')}>
        {I18nService.getString(route.tName)}
      </span>
    </NavLink>
  );
}

// app > stage > rows [sidebar, content]

function AppSidebar() {
  return (
    <div className={cx('app-sidebar-container', 'scrollable')}>
      <div className={cx('app-sidebar-logo')}/>
      <div className={cx('app-sidebar-navigation-list')}>
        {routes.map(route => (
          <AppSidebarNavigationLink key={route.path} route={route}/>
        ))}
      </div>
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

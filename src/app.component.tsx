import React, {useEffect, useState} from 'react';
import classNames from 'classnames/bind';
import {Provider, useSelector} from 'react-redux';
import {MemoryRouter as Router, NavLink} from 'react-router-dom';
import * as _ from 'lodash';

import {Icon, RouterSwitchComponent} from './components';
import {IAppStatePersistor} from './interfaces';
import {MediaLocalProvider} from './providers';
import {RootState} from './reducers';
import {I18nService, MediaProviderService} from './services';

import * as AppComponents from './components';

import statePersistors from './persistors';
import store from './store';
import {registerStatePersistor, loadState} from './store/persistor';

import './app.global.css';
import styles from './app.component.css';
import routes from './app.routes';

const cx = classNames.bind(styles);

// register media providers
const mediaLocalProvider = new MediaLocalProvider();
MediaProviderService.registerMediaProvider(mediaLocalProvider);

// register state persistors
_.forEach(statePersistors, (statePersistor: IAppStatePersistor, stateKey: string) => {
  registerStatePersistor(stateKey, statePersistor);
});

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
    icon: string,
    name: string,
  }
}) {
  const {
    route: {
      icon,
      name,
      path,
    },
  } = props;

  return (
    <NavLink
      to={path}
      activeClassName={cx('selected')}
      className={cx('app-sidebar-navigation-item', 'app-nav-link')}
    >
      <span className={cx('app-sidebar-navigation-item-icon')}>
        <Icon name={icon}/>
      </span>
      <span className={cx('app-sidebar-navigation-item-label')}>
        {I18nService.getString(name)}
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

// app > splash

function AppSplash() {
  return (
    <div className={cx('app-splash-container')}/>
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
  const {
    mediaPlaybackCurrentMediaTrack,
  } = useSelector((state: RootState) => state.mediaPlayer);

  return (
    <div className={cx('app-media-player-container', {
      active: !!mediaPlaybackCurrentMediaTrack,
    })}
    >
      <AppComponents.MediaSessionComponent/>
      <AppComponents.MediaPlayerRibbonComponent/>
    </div>
  );
}

// app > columns [splash | stage, media player]

export function AppComponent() {
  const [appStateIsLoading, setAppStateIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setAppStateIsLoading(true);

    loadState(store)
      .then(() => {
        setAppStateIsLoading(false);
      })
      .catch((error) => {
        throw new Error(`AppComponent encountered error while loading state - ${error.message}`);
      });
  }, []);

  return (
    <div className={cx('app-container')}>
      {appStateIsLoading && (
        <AppSplash/>
      )}
      {!appStateIsLoading && (
        <Provider store={store}>
          <Router>
            <AppStage/>
            <AppMediaPlayer/>
          </Router>
        </Provider>
      )}
    </div>
  );
}

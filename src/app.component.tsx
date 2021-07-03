import React from 'react';
import {Route, HashRouter as Router, Switch} from 'react-router-dom';
import classNames from 'classnames/bind';
import {useSelector} from 'react-redux';

import {Routes} from './constants';
import {MediaLocalProvider} from './providers';
import {RootState} from './reducers';
import {MediaProviderService} from './services';

import * as AppComponents from './components';
import * as AppPages from './pages';

import './app.global.css';
import styles from './app.component.css';

const cx = classNames.bind(styles);

// register media providers
const mediaLocalProvider = new MediaLocalProvider();
MediaProviderService.registerMediaProvider(mediaLocalProvider);

function AppContentHeader() {
  return (
    <div className={cx('app-content-header-container')}>
      <AppComponents.MediaContentHeaderComponent/>
    </div>
  );
}

function AppContentBrowser() {
  return (
    <div className={cx('app-content-browser-container')}>
      <Switch>
        <Route path={Routes.SETTINGS}>
          <AppPages.SettingsComponent/>
        </Route>
        <Route path={Routes.HOME}>
          <AppPages.HomeComponent/>
        </Route>
      </Switch>
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

function AppSidebar() {
  return (
    <div className={cx('app-sidebar-container')}>
      <AppComponents.MediaSidebarComponent/>
    </div>
  );
}

function AppStage() {
  return (
    <div className={cx('app-stage-container')}>
      <AppSidebar/>
      <AppContent/>
    </div>
  );
}

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

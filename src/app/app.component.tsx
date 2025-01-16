import React, { useEffect, useState } from 'react';
import classNames from 'classnames/bind';
import { Provider, useSelector } from 'react-redux';
import { MemoryRouter as Router } from 'react-router-dom';
import _ from 'lodash';

import {
  MediaSession,
  MediaPlayerRibbonComponent,
} from '../components';

import { ContextMenuProvider, ModalProvider } from '../contexts';
import { AppEnums } from '../enums';
import { IAppStatePersistor } from '../interfaces';
import { MediaLocalProvider } from '../providers';
import { RootState } from '../reducers';
import { AppService, MediaProviderService } from '../services';

import statePersistors from '../persistors';
import store from '../store';
import { registerStatePersistor, loadState, removeStates } from '../store/persistor';

import styles from './app.component.css';
import { Sidebar } from './sidebar/sidebar.component';
import { Browser } from './browser/browser.component';

const cx = classNames.bind(styles);

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
      <Sidebar/>
      <Browser/>
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
      <MediaSession/>
      <MediaPlayerRibbonComponent/>
    </div>
  );
}

// app > columns [splash | stage, media player]

export function App() {
  const [appStateIsLoading, setAppStateIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setAppStateIsLoading(true);

    // register media providers
    const mediaLocalProvider = new MediaLocalProvider();
    MediaProviderService.registerMediaProvider(mediaLocalProvider);

    // register state persistors
    _.forEach(statePersistors, (statePersistor: IAppStatePersistor, stateKey: string) => {
      registerStatePersistor(stateKey, statePersistor);
    });

    // add listeners for messages from main process
    AppService.registerSyncMessageHandler(AppEnums.IPCRendererCommChannels.StateRemovePersisted, removeStates);

    loadState(store)
      .then(() => {
        setAppStateIsLoading(false);
      })
      .catch((error) => {
        throw new Error(`App encountered error while loading state - ${error.message}`);
      });
  }, []);

  return (
    <div className={cx('app-container')}>
      <Provider store={store}>
        {appStateIsLoading && (
          <AppSplash/>
        )}
        {!appStateIsLoading && (
          <Router>
            <ModalProvider>
              <ContextMenuProvider>
                <AppStage/>
                <AppMediaPlayer/>
              </ContextMenuProvider>
            </ModalProvider>
          </Router>
        )}
      </Provider>
    </div>
  );
}

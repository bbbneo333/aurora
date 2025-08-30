import React, { useEffect, useState } from 'react';
import classNames from 'classnames/bind';
import { Provider, useSelector } from 'react-redux';
import { MemoryRouter as Router } from 'react-router-dom';
import _ from 'lodash';

import {
  MediaSession,
  MediaPlayerRibbonComponent,
} from '../components';

import { ContextMenuProvider, ModalProvider, NotificationProvider } from '../contexts';
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

function Splash() {
  return (
    <div className={cx('app-splash')}/>
  );
}

// app > stage

function Stage() {
  return (
    <div className={cx('app-stage')}>
      <Sidebar/>
      <Browser/>
    </div>
  );
}

// app > player

function Player() {
  const {
    mediaPlaybackCurrentMediaTrack,
  } = useSelector((state: RootState) => state.mediaPlayer);

  return (
    <div className={cx('app-player', {
      active: !!mediaPlaybackCurrentMediaTrack,
    })}
    >
      <MediaSession/>
      <MediaPlayerRibbonComponent/>
    </div>
  );
}

// app > columns [splash | stage, player]

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
    <div className={cx('app')}>
      <Provider store={store}>
        {appStateIsLoading && (
          <Splash/>
        )}
        {!appStateIsLoading && (
          <Router>
            <NotificationProvider>
              <ModalProvider>
                <ContextMenuProvider>
                  <Stage/>
                  <Player/>
                </ContextMenuProvider>
              </ModalProvider>
            </NotificationProvider>
          </Router>
        )}
      </Provider>
    </div>
  );
}

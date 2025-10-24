import React, { useEffect, useState } from 'react';
import classNames from 'classnames/bind';
import { Provider, useSelector } from 'react-redux';
import { MemoryRouter as Router, useHistory, useLocation } from 'react-router-dom';
import _ from 'lodash';

import { MediaSession, MediaPlayer } from '../components';
import { Routes } from '../constants';
import { ContextMenuProvider, ModalProvider, NotificationProvider } from '../contexts';
import { IAppStatePersistor } from '../interfaces';
import { MediaLocalProvider } from '../providers';
import { RootState } from '../reducers';
import { MediaProviderService } from '../services';
import { IPCService, IPCRendererCommChannel } from '../modules/ipc';

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
  const history = useHistory();
  const location = useLocation();

  // ui related handlers need to be registered under router tree
  useEffect(() => {
    const listener = IPCService.registerSyncMessageHandler(IPCRendererCommChannel.UIOpenSettings, () => {
      if (location.pathname !== Routes.Settings) {
        history.push(Routes.Settings);
      }
    });

    return () => {
      IPCService.removeSyncMessageListener(IPCRendererCommChannel.UIOpenSettings, listener);
    };
  }, [
    history,
    location.pathname,
  ]);

  useEffect(() => {
    const listener = IPCService.registerSyncMessageHandler(IPCRendererCommChannel.StateRemovePersisted, removeStates);

    return () => {
      IPCService.removeSyncMessageListener(IPCRendererCommChannel.StateRemovePersisted, listener);
    };
  }, []);

  return (
    <div className={cx('app-stage')}>
      <Sidebar/>
      <Browser/>
    </div>
  );
}

// app > player

function Player({ active = false }) {
  return (
    <div className={cx('app-player', {
      active,
    })}
    >
      <MediaSession/>
      <MediaPlayer/>
    </div>
  );
}

// app > stage, player

function Window() {
  const playerCurrentTrack = useSelector((state: RootState) => state.mediaPlayer.mediaPlaybackCurrentMediaTrack);
  const playerIsActive = !!playerCurrentTrack;

  return (
    <Router>
      <NotificationProvider snackbarSx={{
        bottom: playerIsActive ? '110px !important' : undefined, // TODO: Hack to keep it floating above player
      }}
      >
        <ModalProvider>
          <ContextMenuProvider>
            <Stage/>
            <Player active={playerIsActive}/>
          </ContextMenuProvider>
        </ModalProvider>
      </NotificationProvider>
    </Router>
  );
}

// app > columns [splash | window]

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
          <Window/>
        )}
      </Provider>
    </div>
  );
}

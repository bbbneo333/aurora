import React, { useEffect, useRef, useState } from 'react';
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
import { I18nService, MediaLibraryService, MediaProviderService } from '../services';
import { ThemeService } from '../services/theme.service';
import { IPCCommChannel, IPCRenderer, IPCRendererCommChannel } from '../modules/ipc';
import { MediaLibraryActions } from '../enums';

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
  const mediaIsSyncing = useSelector((state: RootState) => state.mediaLibrary.mediaIsSyncing);
  const mediaSyncStateRef = useRef(mediaIsSyncing);

  // ui related handlers need to be registered under router tree
  useEffect(() => {
    const listener = IPCRenderer.addMessageHandler(IPCRendererCommChannel.UIOpenSettings, () => {
      if (location.pathname !== Routes.Settings) {
        history.push(Routes.Settings);
      }
    });

    return () => {
      IPCRenderer.removeMessageHandler(IPCRendererCommChannel.UIOpenSettings, listener);
    };
  }, [
    history,
    location.pathname,
  ]);

  useEffect(() => {
    const listener = IPCRenderer.addMessageHandler(IPCRendererCommChannel.StateRemovePersisted, removeStates);

    return () => {
      IPCRenderer.removeMessageHandler(IPCRendererCommChannel.StateRemovePersisted, listener);
    };
  }, []);

  useEffect(() => {
    try {
      // Initial check
      const status = IPCRenderer.sendSyncMessage(IPCCommChannel.DeviceGetAudioCdStatus);
      store.dispatch({
        type: MediaLibraryActions.SetAudioCd,
        data: status,
      });
    } catch (e) {
      console.error('Failed to get initial audio CD status', e);
    }

    const listener = IPCRenderer.addMessageHandler(IPCRendererCommChannel.DeviceAudioCdUpdate, (status) => {
      store.dispatch({
        type: MediaLibraryActions.SetAudioCd,
        data: status,
      });
    });

    return () => {
      IPCRenderer.removeMessageHandler(IPCRendererCommChannel.DeviceAudioCdUpdate, listener);
    };
  }, []);

  useEffect(() => {
    const wasSyncing = mediaSyncStateRef.current;
    mediaSyncStateRef.current = mediaIsSyncing;
    if (wasSyncing || mediaIsSyncing) {
      if (!mediaIsSyncing && wasSyncing) {
        MediaLibraryService.syncDapLibraryIfEnabled().catch(() => {});
      }
      return () => {};
    }

    const timeoutId = window.setTimeout(() => {
      MediaLibraryService.syncDapLibraryIfEnabled().catch(() => {});
    }, 1800);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [mediaIsSyncing]);

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
  const [, setLocaleVersion] = useState(0);

  useEffect(() => {
    const onLocaleChanged = () => {
      setLocaleVersion(localeVersion => localeVersion + 1);
    };

    window.addEventListener('aurora:locale-changed', onLocaleChanged);
    return () => {
      window.removeEventListener('aurora:locale-changed', onLocaleChanged);
    };
  }, []);

  useEffect(() => {
    setAppStateIsLoading(true);

    ThemeService.initialize();
    I18nService.initialize();

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

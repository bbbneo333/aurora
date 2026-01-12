import React, { useEffect, useSyncExternalStore } from 'react';
import classNames from 'classnames/bind';

import { ActionList, Button } from '../../components';
import { Icons } from '../../constants';
import { MediaProviderService } from '../../services';
import { IPCService, IPCCommChannel } from '../../modules/ipc';

import MediaLocalConstants from './media-local.constants.json';
import { mediaLocalStore, MediaLocalStateActionType } from './media-local.store';
import MediaLocalLibraryService from './media-local-library.service';

import styles from './media-local-settings.component.css';

const cl = classNames.bind(styles);

type MediaLocalSettingsProps = {
  cx: (...args: string[]) => string,
};

function openDirectorySelectionDialog(): string | undefined {
  return IPCService.sendSyncMessage(IPCCommChannel.FSSelectDirectory);
}

export function MediaLocalSettingsComponent({ cx }: MediaLocalSettingsProps) {
  const state = useSyncExternalStore(
    mediaLocalStore.subscribe,
    mediaLocalStore.getState,
  );

  const {
    settings,
    dirty,
    loading,
    saving,
    syncing,
  } = state;

  useEffect(() => {
    mediaLocalStore.dispatch({
      type: MediaLocalStateActionType.SettingsLoad,
    });

    MediaProviderService
      .getMediaProviderSettings(MediaLocalConstants.Provider)
      .then((mediaSettings) => {
        mediaLocalStore.dispatch({
          type: MediaLocalStateActionType.SettingsLoaded,
          data: {
            settings: mediaSettings,
          },
        });
      });
  }, []);

  useEffect(() => {
    if (!settings || !dirty) {
      return;
    }

    mediaLocalStore.dispatch({
      type: MediaLocalStateActionType.SettingsSave,
    });

    MediaProviderService
      .updateMediaProviderSettings(MediaLocalConstants.Provider, settings)
      .then(() => {
        mediaLocalStore.dispatch({
          type: MediaLocalStateActionType.SettingsSaved,
        });
      });
  }, [
    dirty,
    settings,
  ]);

  return (
    <div className={cx('settings-section')}>
      <div className={cx('settings-heading')}>
        Selected Directories
      </div>
      <div className={cx('settings-content')}>
        <div className={cl('settings-directory-list')}>
          <ActionList
            items={settings.library.directories.map(directory => (
              {
                id: directory,
                label: directory,
                icon: Icons.Folder,
              }
            ))}
            onRemove={(directory) => {
              mediaLocalStore.dispatch({
                type: MediaLocalStateActionType.RemoveDirectory,
                data: {
                  directory,
                },
              });
            }}
          />
        </div>
        <div className={cl('settings-directory-action')}>
          <Button
            disabled={loading || saving}
            icon={Icons.AddCircle}
            onButtonSubmit={() => {
              const selectedDirectory = openDirectorySelectionDialog();
              if (selectedDirectory) {
                mediaLocalStore.dispatch({
                  type: MediaLocalStateActionType.AddDirectory,
                  data: {
                    selectedDirectory,
                  },
                });
              }
            }}
          >
            Add Directory
          </Button>
        </div>
        <div className={cl('settings-sync-action')}>
          <Button
            icon={syncing ? Icons.Refreshing : Icons.Refresh}
            disabled={syncing}
            onButtonSubmit={() => {
              MediaLocalLibraryService.syncMediaTracks();
            }}
          >
            Refresh
          </Button>
        </div>
      </div>
    </div>
  );
}

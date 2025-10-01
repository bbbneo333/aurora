import React, { useEffect, useReducer } from 'react';
import classNames from 'classnames/bind';

import { ActionList, Button } from '../../components';
import { Icons } from '../../constants';
import { MediaProviderService } from '../../services';
import { IPCService, IPCCommChannel } from '../../modules/ipc';

import MediaLocalConstants from './media-local.constants.json';
import { mediaLocalSettingsStateReducer, MediaLocalSettingsStateActionType } from './media-local-settings.store';

import styles from './media-local-settings.component.css';

const cl = classNames.bind(styles);

type MediaLocalSettingsProps = {
  cx: (...args: string[]) => string,
};

function openDirectorySelectionDialog(): string | undefined {
  return IPCService.sendSyncMessage(IPCCommChannel.FSSelectDirectory);
}

export function MediaLocalSettingsComponent({ cx }: MediaLocalSettingsProps) {
  const [{
    settings,
    dirty,
    loading,
    saving,
    // saved,
  }, mediaLocalSettingsDispatch] = useReducer(mediaLocalSettingsStateReducer, {
    settings: undefined,
    dirty: false,
    loading: false,
    loaded: false,
    saving: false,
    saved: false,
  });

  useEffect(() => {
    mediaLocalSettingsDispatch({
      type: MediaLocalSettingsStateActionType.SettingsLoad,
    });

    MediaProviderService
      .getMediaProviderSettings(MediaLocalConstants.Provider)
      .then((mediaSettings) => {
        mediaLocalSettingsDispatch({
          type: MediaLocalSettingsStateActionType.SettingsLoaded,
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

    mediaLocalSettingsDispatch({
      type: MediaLocalSettingsStateActionType.SettingsSave,
    });

    MediaProviderService
      .updateMediaProviderSettings(MediaLocalConstants.Provider, settings)
      .then(() => {
        mediaLocalSettingsDispatch({
          type: MediaLocalSettingsStateActionType.SettingsSaved,
        });
      });
  }, [
    dirty,
    settings,
  ]);

  if (loading || !settings || saving) {
    return (
      <div>
        Loading
      </div>
    );
  }

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
              mediaLocalSettingsDispatch({
                type: MediaLocalSettingsStateActionType.RemoveDirectory,
                data: {
                  directory,
                },
              });
            }}
          />
        </div>
        <div className={cl('settings-add-directory')}>
          <Button
            className={cl('settings-add-directory-button')}
            icon={Icons.AddCircle}
            iconClassName={cl('settings-add-directory-button-icon')}
            onButtonSubmit={() => {
              const selectedDirectory = openDirectorySelectionDialog();
              if (selectedDirectory) {
                mediaLocalSettingsDispatch({
                  type: MediaLocalSettingsStateActionType.AddDirectory,
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
      </div>
    </div>
  );
}

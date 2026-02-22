import React, { useEffect, useSyncExternalStore } from 'react';
import classNames from 'classnames/bind';
import { ArgumentArray } from 'classnames';
import { isNil, isNumber } from 'lodash';

import {
  ActionList,
  Button,
  Icon,
  LoaderCircle,
  LoaderCircleProgress,
} from '../../components';

import { Icons } from '../../constants';
import { I18nService, MediaProviderService } from '../../services';
import { DateTimeUtils } from '../../utils';

import { IPCRenderer, IPCCommChannel } from '../../modules/ipc';

import MediaLocalConstants from './media-local.constants.json';
import { mediaLocalStore, MediaLocalStateActionType, MediaSyncDirectoryStats } from './media-local.store';
import MediaLocalLibraryService from './media-local-library.service';

import styles from './media-local-settings.component.css';

const cl = classNames.bind(styles);

type MediaLocalSettingsProps = {
  cx: (...args: ArgumentArray) => string,
};

function openDirectorySelectionDialog(): string | undefined {
  return IPCRenderer.sendSyncMessage(IPCCommChannel.FSSelectDirectory);
}

function MediaDirectoryIcon(props: {
  stats?: MediaSyncDirectoryStats;
  syncing?: boolean;
}) {
  const {
    stats = {},
    syncing = false,
  } = props;

  const hasError = !isNil(stats.error);
  const hasValidProgress = isNumber(stats.filesFound) && isNumber(stats.filesAdded);

  if (hasError) {
    return (
      <Icon
        name={Icons.Error}
        className={cl('settings-directory-icon-error')}
        tooltip={stats.error}
      />
    );
  }

  if (syncing) {
    if (!hasValidProgress) {
      return (
        <LoaderCircle size={16}/>
      );
    }

    const progressPct = (stats.filesAdded! / stats.filesFound!) * 100;

    return (
      <LoaderCircleProgress
        size={16}
        value={progressPct}
      />
    );
  }

  return (
    <Icon
      name={Icons.Completed}
      className={cl('settings-directory-icon-success')}
    />
  );
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
    syncDuration,
    syncFilesFoundCount,
    syncFilesAddedCount,
    syncDirectoryStats,
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
        {I18nService.getString('label_settings_directories')}
      </div>
      <div className={cx('settings-content')}>
        <div className={cl('settings-directory-list')}>
          <ActionList
            items={settings.library.directories.map((directory) => {
              const dirStats = syncDirectoryStats[directory];

              return {
                id: directory,
                label: directory,
                icon: (<MediaDirectoryIcon stats={dirStats} syncing={syncing}/>),
              };
            })}
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
            {I18nService.getString('button_settings_sync_add_directory')}
          </Button>
        </div>
        <div className={cl('settings-sync-action')}>
          <Button
            icon={syncing ? Icons.Refreshing : Icons.Refresh}
            disabled={syncing}
            onButtonSubmit={() => {
              MediaLocalLibraryService.syncMediaTracks();
            }}
            tooltip={(
              <>
                {I18nService.getString('tooltip_settings_sync_file_scanned')}
                :&nbsp;
                {syncFilesFoundCount}
                <br/>
                {I18nService.getString('tooltip_settings_sync_file_added')}
                :&nbsp;
                {syncFilesAddedCount}
                <br/>
                {I18nService.getString('tooltip_settings_sync_time_taken')}
                :&nbsp;
                {DateTimeUtils.formatDuration(syncDuration)}
              </>
            )}
          >
            {I18nService.getString('button_settings_sync_refresh')}
          </Button>
        </div>
      </div>
    </div>
  );
}

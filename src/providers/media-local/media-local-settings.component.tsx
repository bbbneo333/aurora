import React, { useEffect, useSyncExternalStore } from 'react';
import classNames from 'classnames/bind';
import { ArgumentArray } from 'classnames';
import { isNil, isNumber } from 'lodash';

import { ActionList, Button } from '../../components';
import { Icons } from '../../constants';
import { MediaProviderService } from '../../services';
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

function MediaDirectoryLabel(props: {
  directory: string;
  syncing?: boolean;
  stats?: MediaSyncDirectoryStats;
}) {
  const {
    directory,
    syncing = false,
    stats = {},
  } = props;

  const hasError = !isNil(stats.error);
  const hasValidProgress = isNumber(stats.filesFound) && isNumber(stats.filesAdded);

  if (!syncing || !hasValidProgress || hasError) {
    return (
      <>
        {directory}
      </>
    );
  }

  const progress = `(${stats.filesAdded} / ${stats.filesFound})`;

  return (
    <div>
      {directory}
      &nbsp;
      <span className={cl('settings-directory-progress-text')}>
        {progress}
      </span>
    </div>
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
    syncFileCount,
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
        Selected Directories
      </div>
      <div className={cx('settings-content')}>
        <div className={cl('settings-directory-list')}>
          <ActionList
            items={settings.library.directories.map((directory) => {
              const dirStats = syncDirectoryStats[directory];
              const dirHasError = !isNil(dirStats?.error);

              return {
                id: directory,
                label: (<MediaDirectoryLabel directory={directory} syncing={syncing} stats={dirStats}/>),
                icon: dirHasError ? Icons.Error : Icons.Folder,
                iconClass: cl(dirHasError && 'settings-directory-icon-error'),
                iconTooltip: dirHasError ? dirStats.error : undefined,
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
            tooltip={(
              <>
                Files Scanned:&nbsp;
                {syncFileCount}
                <br/>
                Time Taken:&nbsp;
                {DateTimeUtils.formatDuration(syncDuration)}
              </>
            )}
          >
            Refresh
          </Button>
        </div>
      </div>
    </div>
  );
}

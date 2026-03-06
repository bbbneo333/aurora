import React, { useEffect, useSyncExternalStore } from 'react';
import { Form } from 'react-bootstrap';
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
  const hasValidProgress = isNumber(stats.filesFound) && isNumber(stats.filesProcessed);

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

    const progressPct = (stats.filesProcessed! / stats.filesFound!) * 100;

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
    syncFilesProcessedCount,
    syncDirectoryStats,
  } = state;
  const cdImportSettings = settings.cd_import || {
    output_directory: '',
    naming_template: '<Artist> - <Album-Title> (<Year>)',
    discogs_token: '',
  };

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
        <div className={cx('settings-row')}>
          <div>
            <div className={cx('settings-subheading')}>Compact View</div>
            <div className={cx('settings-description')}>{I18nService.getString('label_settings_group_compilations_details')}</div>
          </div>
          <Form.Check
            type="switch"
            id="group-compilations-switch"
            label=""
            checked={settings?.library?.group_compilations_by_folder || false}
            onChange={() => {
              mediaLocalStore.dispatch({
                type: MediaLocalStateActionType.ToggleGroupCompilations,
              });
            }}
          />
        </div>

        <div style={{ marginTop: '20px' }}>
          <div className={cx('settings-subheading')} style={{ marginBottom: '10px' }}>Managed Directories</div>
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

          <div className={cx('settings-action-row')}>
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
        </div>

        <div style={{ marginTop: '20px', borderTop: '1px solid var(--stage-overlay-outline-color)', paddingTop: '20px' }}>
          <div className={cx('settings-subheading')}>Audio-CD Import</div>
          <div className={cx('settings-description')} style={{ marginBottom: '12px' }}>
            Output directory, naming template and Discogs credentials for FLAC imports
          </div>
          <div className={cx('settings-row')}>
            <div style={{ flex: 1, minWidth: '320px' }}>
              <div className={cx('settings-subheading')}>Import Directory</div>
              <div className={cx('settings-description')}>{cdImportSettings.output_directory || 'No directory selected'}</div>
            </div>
            <Button
              icon={Icons.Folder}
              onButtonSubmit={() => {
                const selectedDirectory = openDirectorySelectionDialog();
                if (selectedDirectory) {
                  mediaLocalStore.dispatch({
                    type: MediaLocalStateActionType.SetCdImportDirectory,
                    data: {
                      outputDirectory: selectedDirectory,
                    },
                  });
                }
              }}
            >
              Select Directory
            </Button>
          </div>
          <Form.Group>
            <Form.Label>Naming Template</Form.Label>
            <Form.Control
              type="text"
              value={cdImportSettings.naming_template || ''}
              onChange={(event) => {
                mediaLocalStore.dispatch({
                  type: MediaLocalStateActionType.SetCdImportNamingTemplate,
                  data: {
                    namingTemplate: event.target.value,
                  },
                });
              }}
              placeholder="<Artist> - <Album-Title> (<Year>)"
            />
          </Form.Group>
          <div className={cl('settings-keywords-help')}>
            <div className={cx('settings-subheading')}>Available Keywords</div>
            <div className={cx('settings-description')}>
              Keywords in the format
              {' '}
              {'<Keyword>'}
              {' '}
              are automatically replaced in the folder name.
            </div>
            <div className={cl('settings-keywords-table-wrap')}>
              <table className={cl('settings-keywords-table')}>
                <thead>
                  <tr>
                    <th>Keyword</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{'<Artist>'}</td>
                    <td>Album Artist</td>
                  </tr>
                  <tr>
                    <td>{'<Album-Artist>'}</td>
                    <td>Album Artist</td>
                  </tr>
                  <tr>
                    <td>{'<Album Artist>'}</td>
                    <td>Album Artist</td>
                  </tr>
                  <tr>
                    <td>{'<Album-Title>'}</td>
                    <td>Album Title</td>
                  </tr>
                  <tr>
                    <td>{'<Album Title>'}</td>
                    <td>Album Title</td>
                  </tr>
                  <tr>
                    <td>{'<Album>'}</td>
                    <td>Album Title</td>
                  </tr>
                  <tr>
                    <td>{'<Year>'}</td>
                    <td>Release Year</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <Form.Group>
            <Form.Label>Discogs Dev Key</Form.Label>
            <Form.Control
              type="password"
              value={cdImportSettings.discogs_token || ''}
              onChange={(event) => {
                mediaLocalStore.dispatch({
                  type: MediaLocalStateActionType.SetDiscogsToken,
                  data: {
                    discogsToken: event.target.value,
                  },
                });
              }}
              placeholder="Discogs Token"
            />
          </Form.Group>
        </div>

        <div style={{ marginTop: '20px', borderTop: '1px solid var(--stage-overlay-outline-color)', paddingTop: '20px' }}>
          <div className={cx('settings-row')}>
            <div>
              <div className={cx('settings-subheading')}>Synchronize Library</div>
              <div className={cx('settings-description')}>Manual database refresh</div>
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
                    {I18nService.getString('tooltip_settings_sync_file_found')}
                    :&nbsp;
                    {syncFilesFoundCount}
                    <br/>
                    {I18nService.getString('tooltip_settings_sync_file_processed')}
                    :&nbsp;
                    {syncFilesProcessedCount}
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
      </div>
    </div>
  );
}

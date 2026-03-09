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
  const keywordGroups = [
    {
      label: I18nService.getString('label_settings_keyword_album_artist'),
      keywords: ['<Artist>', '<Album-Artist>', '<Album Artist>'],
    },
    {
      label: I18nService.getString('label_settings_keyword_album_title'),
      keywords: ['<Album-Title>', '<Album Title>', '<Album>'],
    },
    {
      label: I18nService.getString('label_settings_keyword_release_year'),
      keywords: ['<Year>'],
    },
  ];

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
      })
      .catch((error) => {
        console.error('MediaLocalSettingsComponent - failed loading settings - %o', error);
        mediaLocalStore.dispatch({
          type: MediaLocalStateActionType.SettingsLoaded,
          data: {
            settings: mediaLocalStore.getState().settings,
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
      })
      .catch((error) => {
        console.error('MediaLocalSettingsComponent - failed saving settings - %o', error);
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
            <div className={cx('settings-subheading')}>{I18nService.getString('label_settings_group_compilations')}</div>
            <div className={cx('settings-description')}>{I18nService.getString('label_settings_group_compilations_details')}</div>
          </div>
          <div className={cx('theme-switch')}>
            <button
              type="button"
              className={cx('theme-switch-item', { active: settings?.library?.group_compilations_by_folder || false })}
              onClick={() => {
                mediaLocalStore.dispatch({
                  type: MediaLocalStateActionType.ToggleGroupCompilations,
                });
              }}
            >
              {settings?.library?.group_compilations_by_folder
                ? I18nService.getString('label_toggle_on')
                : I18nService.getString('label_toggle_off')}
            </button>
          </div>
        </div>

        <div style={{ marginTop: '20px' }}>
          <div className={cx('settings-subheading')} style={{ marginBottom: '10px' }}>
            {I18nService.getString('label_settings_managed_directories')}
          </div>
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
              className={cl('settings-action-button')}
              variant={['primary']}
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
            {I18nService.getString('label_settings_audio_cd_import_description')}
          </div>
          <div className={cx('settings-row')}>
            <div style={{ flex: 1, minWidth: '320px' }}>
              <div className={cx('settings-subheading')}>{I18nService.getString('label_settings_import_directory')}</div>
              <div className={cx('settings-description')}>
                {cdImportSettings.output_directory || I18nService.getString('label_settings_no_directory_selected')}
              </div>
            </div>
            <Button
              className={cl('settings-action-button')}
              variant={['primary']}
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
              {I18nService.getString('button_settings_select_directory')}
            </Button>
          </div>
          <Form.Group>
            <Form.Label>{I18nService.getString('label_settings_naming_template')}</Form.Label>
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
            <div className={cx('settings-subheading')}>{I18nService.getString('label_settings_available_keywords')}</div>
            <div className={cx('settings-description')}>
              {I18nService.getString('label_settings_keywords_description')}
              {' '}
              {'<Keyword>'}
            </div>
            <div className={cl('settings-keywords-grid')}>
              {keywordGroups.map(keywordGroup => (
                <div key={keywordGroup.label} className={cl('settings-keyword-group')}>
                  <div className={cl('settings-keyword-group-label')}>
                    {keywordGroup.label}
                  </div>
                  <div className={cl('settings-keyword-chip-row')}>
                    {keywordGroup.keywords.map(keyword => (
                      <span key={keyword} className={cl('settings-keyword-chip')}>
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Form.Group>
            <Form.Label>{I18nService.getString('label_settings_discogs_dev_key')}</Form.Label>
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
              placeholder={I18nService.getString('placeholder_settings_discogs_token')}
            />
          </Form.Group>
        </div>

        <div style={{ marginTop: '20px', borderTop: '1px solid var(--stage-overlay-outline-color)', paddingTop: '20px' }}>
          <div className={cx('settings-row')}>
            <div>
              <div className={cx('settings-subheading')}>{I18nService.getString('label_settings_synchronize_library')}</div>
              <div className={cx('settings-description')}>{I18nService.getString('label_settings_manual_database_refresh')}</div>
            </div>
            <div className={cl('settings-sync-action')}>
              <Button
                className={cl('settings-action-button')}
                variant={['primary']}
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

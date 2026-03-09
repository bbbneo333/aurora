import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import classNames from 'classnames/bind';

import {
  Button,
  Icon,
  MediaSettingsResetDialog,
  Link,
} from '../../components';

import { Icons, Links } from '../../constants';
import { useModal } from '../../contexts';
import { RootState } from '../../reducers';
import { AppService, I18nService, MediaLibraryService } from '../../services';
import { IDapSyncProgressSnapshot } from '../../services/media-library.service';
import { AppLocale } from '../../services/i18n.service';
import { ThemeService, ThemeMode } from '../../services/theme.service';
import { IPCCommChannel, IPCRenderer } from '../../modules/ipc';

import styles from './settings.component.css';

const cx = classNames.bind(styles);
const languageOptions: AppLocale[] = ['de', 'en', 'fr', 'it', 'es'];

function ProviderSettings() {
  const mediaProviderRegistry = useSelector((state: RootState) => state.mediaProviderRegistry);

  return (
    <>
      {
        mediaProviderRegistry.mediaProviders.map((mediaRegisteredProvider) => {
          const mediaProviderSettingsComponent = mediaRegisteredProvider.mediaSettingsService.getSettingsComponent();

          if (mediaProviderSettingsComponent) {
            return (
              <div
                key={mediaRegisteredProvider.mediaProviderIdentifier}
              >
                {React.createElement(mediaProviderSettingsComponent, {
                  cx,
                })}
              </div>
            );
          }

          return (
            <></>
          );
        })
      }
    </>
  );
}

const UI_SETTINGS_KEY = 'aurora:ui-settings';

export function SettingsPage() {
  const { showModal } = useModal();
  const themeMode = useMemo<ThemeMode>(() => ThemeService.mode, []);
  const [hideArtist, setHideArtist] = React.useState(false);
  const [locale, setLocale] = React.useState<AppLocale>(I18nService.locale);
  const [dapTargetDirectory, setDapTargetDirectory] = React.useState('');
  const [dapAutoSyncEnabled, setDapAutoSyncEnabled] = React.useState(false);
  const [dapDeleteMissingOnDevice, setDapDeleteMissingOnDevice] = React.useState(true);
  const [dapSyncProgress, setDapSyncProgress] = React.useState<IDapSyncProgressSnapshot>(MediaLibraryService.getDapSyncProgressSnapshot());

  React.useEffect(() => {
    const saved = localStorage.getItem(UI_SETTINGS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setHideArtist(!!parsed.hideArtist);
      } catch (e) {
        // ignore
      }
    }
  }, []);

  React.useEffect(() => {
    const settings = MediaLibraryService.getDapSyncSettings();
    setDapTargetDirectory(settings.targetDirectory);
    setDapAutoSyncEnabled(settings.autoSyncEnabled);
    setDapDeleteMissingOnDevice(settings.deleteMissingOnDevice);
  }, []);

  React.useEffect(() => MediaLibraryService.subscribeDapSyncProgress((snapshot) => {
    setDapSyncProgress(snapshot);
  }), []);

  React.useEffect(() => {
    const onLocaleChanged = () => {
      setLocale(I18nService.locale);
    };

    window.addEventListener('aurora:locale-changed', onLocaleChanged);
    return () => {
      window.removeEventListener('aurora:locale-changed', onLocaleChanged);
    };
  }, []);

  const toggleHideArtist = () => {
    const newValue = !hideArtist;
    setHideArtist(newValue);
    localStorage.setItem(UI_SETTINGS_KEY, JSON.stringify({ hideArtist: newValue }));
    window.dispatchEvent(new Event('aurora:settings-changed'));
  };

  const persistDapSettings = (nextSettings: {
    targetDirectory: string;
    autoSyncEnabled: boolean;
    deleteMissingOnDevice: boolean;
  }) => {
    MediaLibraryService.saveDapSyncSettings(nextSettings);
    setDapTargetDirectory(nextSettings.targetDirectory);
    setDapAutoSyncEnabled(nextSettings.autoSyncEnabled);
    setDapDeleteMissingOnDevice(nextSettings.deleteMissingOnDevice);
  };

  const dapProgressPercent = dapSyncProgress.totalItems > 0
    ? Math.min(100, Math.round((dapSyncProgress.processedItems / dapSyncProgress.totalItems) * 100))
    : 0;
  const formatDuration = (durationMs?: number) => {
    if (!durationMs || durationMs <= 0) {
      return '0:00';
    }

    const totalSeconds = Math.ceil(durationMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  };
  const dapProgressStatusLabels = {
    idle: 'Bereit',
    planning: 'Planen',
    copying: 'Kopieren',
    cleaning: 'Bereinigen',
    done: 'Abgeschlossen',
    aborted: 'Abgebrochen',
    error: 'Fehler',
  };
  const dapProgressStatusLabel = dapProgressStatusLabels[dapSyncProgress.phase] || 'Bereit';

  return (
    <div className={cx('settings-container', 'container-fluid')}>
      <div className={cx('settings-header')}>
        {I18nService.getString('label_settings_header')}
      </div>
      <div className={cx('settings-section', 'settings-card')}>
        <div className={cx('settings-heading')}>{I18nService.getString('label_settings_view_interface')}</div>
        <div className={cx('settings-content')}>
          <div className={cx('settings-row')}>
            <div>
              <div className={cx('settings-subheading')}>{I18nService.getString('label_settings_theme')}</div>
              <div className={cx('settings-description')}>{I18nService.getString('label_settings_theme_description')}</div>
            </div>
            <div className={cx('theme-switch')}>
              <button
                type="button"
                className={cx('theme-switch-item', { active: themeMode === 'light' })}
                onClick={() => ThemeService.set('light')}
              >
                {I18nService.getString('label_theme_light')}
              </button>
              <button
                type="button"
                className={cx('theme-switch-item', { active: themeMode === 'dark' })}
                onClick={() => ThemeService.set('dark')}
              >
                {I18nService.getString('label_theme_dark')}
              </button>
              <button
                type="button"
                className={cx('theme-switch-item', { active: themeMode === 'auto' })}
                onClick={() => ThemeService.set('auto')}
              >
                {I18nService.getString('label_theme_auto')}
              </button>
            </div>
          </div>
          <div className={cx('settings-row')}>
            <div>
              <div className={cx('settings-subheading')}>{I18nService.getString('label_settings_language')}</div>
              <div className={cx('settings-description')}>{I18nService.getString('label_settings_language_description')}</div>
            </div>
            <div style={{ minWidth: '180px' }}>
              <select
                className="form-control"
                value={locale}
                onChange={(event) => {
                  I18nService.setLocale(event.target.value);
                }}
              >
                {languageOptions.map(languageOption => (
                  <option key={languageOption} value={languageOption}>
                    {I18nService.getString(`label_language_${languageOption}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className={cx('settings-row')}>
            <div>
              <div className={cx('settings-subheading')}>{I18nService.getString('label_settings_hide_artist')}</div>
              <div className={cx('settings-description')}>{I18nService.getString('label_settings_hide_artist_description')}</div>
            </div>
            <div className={cx('theme-switch')}>
              <button
                type="button"
                className={cx('theme-switch-item', { active: hideArtist })}
                onClick={toggleHideArtist}
              >
                {hideArtist
                  ? I18nService.getString('label_toggle_on')
                  : I18nService.getString('label_toggle_off')}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className={cx('settings-section', 'settings-card')}>
        <div className={cx('settings-heading')}>{I18nService.getString('label_settings_sources_directories')}</div>
        <div className={cx('settings-content')}>
          <ProviderSettings/>
        </div>
      </div>
      <div className={cx('settings-section', 'settings-card')}>
        <div className={cx('settings-heading')}>
          DAP Sync
        </div>
        <div className={cx('settings-content')}>
          <div className={cx('settings-row')}>
            <div>
              <div className={cx('settings-subheading')}>Zielordner</div>
              <div className={cx('settings-description')}>
                {dapTargetDirectory || 'Kein Ordner ausgewählt'}
              </div>
            </div>
            <Button
              onButtonSubmit={() => {
                const selectedDirectory = IPCRenderer.sendSyncMessage(IPCCommChannel.FSSelectDirectory);
                if (!selectedDirectory) {
                  return;
                }

                persistDapSettings({
                  targetDirectory: selectedDirectory,
                  autoSyncEnabled: dapAutoSyncEnabled,
                  deleteMissingOnDevice: dapDeleteMissingOnDevice,
                });
              }}
            >
              Ordner auswählen
            </Button>
          </div>
          <div className={cx('settings-row')}>
            <div>
              <div className={cx('settings-subheading')}>Automatische Synchronisierung</div>
              <div className={cx('settings-description')}>
                Nach Bibliotheks-Updates wird automatisch auf USB/SD synchronisiert.
              </div>
            </div>
            <div className={cx('theme-switch')}>
              <button
                type="button"
                className={cx('theme-switch-item', { active: dapAutoSyncEnabled })}
                onClick={() => {
                  persistDapSettings({
                    targetDirectory: dapTargetDirectory,
                    autoSyncEnabled: !dapAutoSyncEnabled,
                    deleteMissingOnDevice: dapDeleteMissingOnDevice,
                  });
                }}
              >
                {dapAutoSyncEnabled
                  ? I18nService.getString('label_toggle_on')
                  : I18nService.getString('label_toggle_off')}
              </button>
            </div>
          </div>
          <div className={cx('settings-row')}>
            <div>
              <div className={cx('settings-subheading')}>Gelöschte Dateien auf DAP entfernen</div>
              <div className={cx('settings-description')}>
                Entfernt Titel im Sync-Ordner, die nicht mehr in Aurora vorhanden sind.
              </div>
            </div>
            <div className={cx('theme-switch')}>
              <button
                type="button"
                className={cx('theme-switch-item', { active: dapDeleteMissingOnDevice })}
                onClick={() => {
                  persistDapSettings({
                    targetDirectory: dapTargetDirectory,
                    autoSyncEnabled: dapAutoSyncEnabled,
                    deleteMissingOnDevice: !dapDeleteMissingOnDevice,
                  });
                }}
              >
                {dapDeleteMissingOnDevice
                  ? I18nService.getString('label_toggle_on')
                  : I18nService.getString('label_toggle_off')}
              </button>
            </div>
          </div>
          <div className={cx('settings-action-row')}>
            <Button
              variant={['primary']}
              disabled={dapSyncProgress.isRunning || !dapTargetDirectory}
              onButtonSubmit={() => {
                if (dapSyncProgress.isRunning || !dapTargetDirectory) {
                  return;
                }

                MediaLibraryService.syncDapLibrary({
                  targetDirectory: dapTargetDirectory,
                  deleteMissingOnDevice: dapDeleteMissingOnDevice,
                });
              }}
            >
              {dapSyncProgress.canResume ? 'Synchronisierung fortsetzen' : 'Jetzt synchronisieren'}
            </Button>
            <Button
              variant={['outline']}
              disabled={!dapSyncProgress.isRunning}
              onButtonSubmit={() => {
                MediaLibraryService.cancelDapLibrarySync();
              }}
            >
              Abbrechen
            </Button>
          </div>
          <div className={cx('dap-progress-container')}>
            <div className={cx('dap-progress-header')}>
              <span>{dapProgressStatusLabel}</span>
              <span>
                {dapProgressPercent}
                %
              </span>
            </div>
            <div className={cx('dap-progress-track')}>
              <div
                className={cx('dap-progress-bar')}
                style={{
                  width: `${dapProgressPercent}%`,
                }}
              />
            </div>
            <div className={cx('dap-progress-meta')}>
              <span>
                {dapSyncProgress.processedItems}
                {' / '}
                {dapSyncProgress.totalItems}
              </span>
              <span>
                Restzeit:
                {' '}
                {formatDuration(dapSyncProgress.etaMs)}
              </span>
            </div>
            {!!dapSyncProgress.resumedFromProcessedItems && !dapSyncProgress.isRunning && (
              <div className={cx('settings-description')}>
                Fortsetzbar ab
                {' '}
                {dapSyncProgress.resumedFromProcessedItems}
                {' '}
                bereits verarbeiteten Dateien.
              </div>
            )}
            {dapSyncProgress.errorMessage && (
              <div className={cx('settings-description')}>
                {dapSyncProgress.errorMessage}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className={cx('settings-section', 'settings-card')}>
        <div className={cx('settings-heading')}>
          {I18nService.getString('label_settings_maintenance')}
        </div>
        <div className={cx('settings-content')}>
          <div>
            {I18nService.getString('label_settings_reset_app_description')}
          </div>
          <div>
            <Button
              variant={['danger']}
              onButtonSubmit={() => {
                showModal(MediaSettingsResetDialog);
              }}
            >
              {I18nService.getString('button_settings_reset_app')}
            </Button>
          </div>
        </div>
      </div>
      <div className={cx('settings-section', 'settings-card')}>
        <div className={cx('settings-heading')}>{I18nService.getString('label_settings_info')}</div>
        <div className={cx('settings-content', 'links')}>
          <div>
            <Link href={Links.Project}>
              <Icon name={Icons.Github}/>
              {`${AppService.details.display_name} - ${AppService.details.version} (${AppService.details.build})`}
            </Link>
          </div>
          <div>
            <Link href={Links.ProjectReportIssue}>
              <Icon name={Icons.Bug}/>
              {I18nService.getString('link_report_issue')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

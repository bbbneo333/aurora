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
const AppLogo = require('../../../assets/icons/icon.png');

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
  const originalRepositoryLink = Links.ProjectOriginal || Links.Project;

  return (
    <div className={cx('settings-container', 'container-fluid')}>
      <div className={cx('settings-header')}>
        {I18nService.getString('label_settings_header')}
      </div>
      <div className={cx('settings-layout')}>
        <div className={cx('settings-main-column')}>
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
                  className={cx('settings-reset-button')}
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
        </div>
        <aside className={cx('settings-info-column')}>
          <div className={cx('settings-info-logo')} style={{ backgroundImage: `url(${AppLogo})` }}/>
          <div className={cx('settings-info-heading')}>
            {I18nService.getString('label_settings_info')}
          </div>
          <div className={cx('settings-info-content')}>
            <div className={cx('settings-info-item')}>
              <Icon name={Icons.Github}/>
              <div>
                <div className={cx('settings-info-title')}>Fork-Information</div>
                <div className={cx('settings-description')}>
                  Ich habe das Projekt geforkt, weil ich einen echten All-in-One-FLAC-Player gesucht habe und in Aurora dafür eine starke technische Basis gesehen habe.
                </div>
                <div className={cx('settings-description')}>
                  Für meine tägliche Nutzung fehlten mir jedoch mehrere Kernfunktionen, die ich nicht nur konfigurieren, sondern tief in der Architektur erweitern wollte.
                </div>
                <div className={cx('settings-description')}>
                  Aus diesem Grund ist aus dem ursprünglichen Projekt
                  {' '}
                  ein klar fokussierter Fork entstanden, der auf Stabilität,
                  {' '}
                  gute Bedienbarkeit und einen reproduzierbaren
                  {' '}
                  Bibliotheks-Workflow ausgelegt ist.
                </div>
                <div className={cx('settings-description')}>
                  Seit dem Fork wurden unter anderem CD-Import
                  {' '}
                  mit Discogs-Integration, robusteres Datenbank-Handling,
                  {' '}
                  DAP-Sync, Podcast-Verzeichnisse sowie zahlreiche
                  {' '}
                  UI-Optimierungen inklusive Light- und Dark-Mode ergänzt.
                </div>
                <Link href={originalRepositoryLink}>
                  Original Repository öffnen
                </Link>
              </div>
            </div>
            <div className={cx('settings-info-item')}>
              <Icon name={Icons.Refresh}/>
              <div>
                <div className={cx('settings-info-title')}>Entwicklung mit KI-Unterstützung</div>
                <div className={cx('settings-description')}>
                  Die Weiterentwicklung erfolgt mit KI-Unterstützung, damit Ideen schneller in lauffähige Implementierungen überführt werden können.
                </div>
                <div className={cx('settings-description')}>
                  Das beschleunigt Iterationen in Bereichen wie UI-Feinschliff, Datenfluss, Importlogik und Qualitätsverbesserungen.
                </div>
                <div className={cx('settings-description')}>
                  Gleichzeitig bleibt die technische Entscheidungshoheit bewusst im Projekt: neue Änderungen werden geprüft, getestet und auf den praktischen Nutzen im Alltag ausgerichtet.
                </div>
                <div className={cx('settings-description')}>
                  So entsteht ein schneller Entwicklungszyklus, ohne die Kontrolle über Funktion, Stabilität und langfristige Wartbarkeit zu verlieren.
                </div>
              </div>
            </div>
            <div className={cx('settings-info-item')}>
              <Icon name={Icons.Bug}/>
              <div>
                <div className={cx('settings-info-title')}>
                  {`${AppService.details.display_name} ${AppService.details.version} (${AppService.details.build})`}
                </div>
                <Link href={Links.ProjectReportIssue}>
                  {I18nService.getString('link_report_issue')}
                </Link>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

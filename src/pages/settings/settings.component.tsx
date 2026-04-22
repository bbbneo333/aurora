import React, { useEffect } from 'react';
import classNames from 'classnames/bind';
import { useSelector } from 'react-redux';

import {
  Button,
  Icon,
  MediaSettingsResetDialog,
  Link,
  Switch,
} from '../../components';

import { Icons, Links } from '../../constants';
import { useModal } from '../../contexts';
import { RootState } from '../../reducers';
import { AppService, I18nService, SettingsService } from '../../services';
import { StringUtils, VersionUtils } from '../../utils';

import styles from './settings.component.css';
import { ProviderSettings } from './provider-settings.component';

const cx = classNames.bind(styles);

export function SettingsPage() {
  const {
    settings,
    loading,
    saving,
    updateCheckInProgress,
    updateAvailable,
    updateLatestRelease,
  } = useSelector((state: RootState) => state.mediaSettings);

  const { showModal } = useModal();

  useEffect(() => {
    SettingsService.loadSettings();
  }, []);

  return (
    <div className={cx('settings-container', 'container-fluid')}>
      <div className={cx('settings-header')}>
        {I18nService.getString('label_settings_header')}
      </div>
      <div className={cx('settings-section')}>
        <ProviderSettings/>
      </div>
      <div className={cx('settings-section')}>
        <div className={cx('settings-heading')}>
          {I18nService.getString('label_settings_updates_header')}
        </div>
        <div className={cx('settings-content')}>
          <div className={cx('settings-form-group')}>
            <div className={cx('settings-form-label')}>
              {I18nService.getString('label_settings_updates_auto_check')}
            </div>
            <div className={cx('settings-form-control')}>
              <Switch
                disabled={loading || saving}
                checked={settings.updates_auto_check}
                onChange={() => {
                  SettingsService.toggleAutoUpdateCheck();
                }}
              />
            </div>
          </div>
          <div className={cx('settings-form-group')}>
            <div className={cx('settings-form-label')}>
              {I18nService.getString('label_settings_updates_prerelease')}
            </div>
            <div className={cx('settings-form-control')}>
              <Switch
                disabled={loading || saving}
                checked={settings.updates_prerelease}
                onChange={() => {
                  SettingsService.togglePreRelease();
                }}
              />
            </div>
          </div>
          <div>
            <Button
              disabled={updateCheckInProgress}
              icon={updateCheckInProgress ? Icons.Refreshing : Icons.Refresh}
              onButtonSubmit={() => {
                SettingsService.checkForUpdates();
              }}
            >
              {I18nService.getString('button_settings_updates_check')}
            </Button>
          </div>
          {(updateAvailable && updateLatestRelease) ? (
            <div>
              <Link
                disabled={updateCheckInProgress}
                href={StringUtils.buildLink(Links.ProjectRelease, {
                  version: VersionUtils.normalizeVersion(updateLatestRelease.version),
                })}
              >
                <Icon name={Icons.Github}/>
                {I18nService.getString('link_settings_available_version', {
                  version: VersionUtils.normalizeVersion(updateLatestRelease.version),
                })}
              </Link>
            </div>
          ) : (
            <div>
              <Link
                disabled={updateCheckInProgress}
                href={StringUtils.buildLink(Links.ProjectRelease, {
                  version: VersionUtils.normalizeVersion(AppService.details.version),
                })}
              >
                <Icon name={Icons.Github}/>
                {I18nService.getString('link_settings_installed_version', {
                  version: VersionUtils.normalizeVersion(AppService.details.version),
                })}
              </Link>
            </div>
          )}
        </div>
      </div>
      <div className={cx('settings-section')}>
        <div className={cx('settings-heading')}>
          {I18nService.getString('label_settings_reset_header')}
        </div>
        <div className={cx('settings-content')}>
          <div>
            {I18nService.getString('label_settings_reset_details')}
          </div>
          <div>
            <Button
              variant={['danger']}
              onButtonSubmit={() => {
                showModal(MediaSettingsResetDialog);
              }}
            >
              {I18nService.getString('button_settings_reset')}
            </Button>
          </div>
        </div>
      </div>
      <div className={cx('settings-section')}>
        <div className={cx('settings-content')}>
          <div>
            <Link href={Links.ProjectReportIssue}>
              <Icon name={Icons.Bug}/>
              {I18nService.getString('link_report_issue')}
            </Link>
          </div>
          <div className={cx('text-dark')}>
            {I18nService.getString('label_settings_build', {
              appName: AppService.details.display_name,
              build: AppService.details.build,
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

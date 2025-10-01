import React from 'react';
import { useSelector } from 'react-redux';
import classNames from 'classnames/bind';

import { Button, MediaSettingsResetDialog } from '../../components';
import { useModal } from '../../contexts';
import { RootState } from '../../reducers';
import { I18nService } from '../../services';

import styles from './settings.component.css';

const cx = classNames.bind(styles);

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

export function SettingsPage() {
  const { showModal } = useModal();

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
          Danger Zone
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
              {I18nService.getString('button_reset_settings')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

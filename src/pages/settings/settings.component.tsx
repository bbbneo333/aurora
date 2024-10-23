import React from 'react';
import { useSelector } from 'react-redux';
import classNames from 'classnames/bind';

import { RootState } from '../../reducers';

import styles from './settings.component.css';

const cx = classNames.bind(styles);

export function SettingsComponent() {
  const mediaProviderRegistry = useSelector((state: RootState) => state.mediaProviderRegistry);

  return (
    <div className={cx('settings-container', 'container-fluid')}>
      <div className={cx('settings-header')}>
        Settings
      </div>

      {mediaProviderRegistry.mediaProviders.map((mediaRegisteredProvider) => {
        const mediaProviderSettingsComponent = mediaRegisteredProvider.mediaSettingsService.getSettingsComponent();

        if (mediaProviderSettingsComponent) {
          return (
            <div key={mediaRegisteredProvider.mediaProviderIdentifier} className={cx('settings-section')}>
              {React.createElement(mediaProviderSettingsComponent, {
                cx,
              })}
            </div>
          );
        }

        return (
          <></>
        );
      })}
    </div>
  );
}

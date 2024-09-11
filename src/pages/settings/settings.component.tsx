import React from 'react';
import { useSelector } from 'react-redux';

import { RootState } from '../../reducers';

export function SettingsComponent() {
  const mediaProviderRegistry = useSelector((state: RootState) => state.mediaProviderRegistry);

  return (
    <div>
      This is the settings page

      {mediaProviderRegistry.mediaProviders.map((mediaRegisteredProvider) => {
        const mediaProviderSettingsComponent = mediaRegisteredProvider.mediaSettingsService.getSettingsComponent();

        if (mediaProviderSettingsComponent) {
          return (
            React.createElement(mediaProviderSettingsComponent, {
              key: mediaRegisteredProvider.mediaProviderIdentifier,
            })
          );
        }

        return (
          <div key={mediaRegisteredProvider.mediaProviderIdentifier}>
            This Provider does not have any settings
          </div>
        );
      })}
    </div>
  );
}

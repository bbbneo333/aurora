import {IMediaSettingsComponent} from '../../interfaces';

import {IMediaLocalSettingsService, IMediaLocalSettings} from './media-local.interfaces';
import {MediaLocalSettingsComponent} from './media-local-settings.component';

class MediaLocalSettingsService implements IMediaLocalSettingsService {
  getDefaultSettings(): IMediaLocalSettings {
    return {
      library: {
        directories: [],
      },
    };
  }

  getSettingsComponent(): IMediaSettingsComponent {
    return MediaLocalSettingsComponent;
  }
}

export default new MediaLocalSettingsService();

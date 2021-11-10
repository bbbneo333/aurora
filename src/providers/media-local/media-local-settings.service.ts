import {IMediaSettingsComponent, IMediaSettingsService} from '../../interfaces';

import {IMediaLocalSettings} from './media-local.interfaces';
import {MediaLocalSettingsComponent} from './media-local-settings.component';

class MediaLocalSettingsService implements IMediaSettingsService {
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

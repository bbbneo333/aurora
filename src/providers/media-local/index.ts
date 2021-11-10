import {IMediaProvider} from '../../interfaces';

import MediaLocalLibraryService from './media-local-library.service';
import MediaLocalPlaybackService from './media-local-playback.service';
import MediaLocalSettingsService from './media-local-settings.service';
import MediaLocalConstants from './media-local.constants.json';

export class MediaLocalProvider implements IMediaProvider {
  readonly mediaProviderIdentifier = MediaLocalConstants.Provider;
  readonly mediaLibraryService: typeof MediaLocalLibraryService;
  readonly mediaPlaybackService: typeof MediaLocalPlaybackService;
  readonly mediaSettingsService: typeof MediaLocalSettingsService;

  constructor() {
    this.mediaLibraryService = MediaLocalLibraryService;
    this.mediaPlaybackService = MediaLocalPlaybackService;
    this.mediaSettingsService = MediaLocalSettingsService;
  }

  onMediaProviderRegistered(): void {
    this.mediaLibraryService.onProviderRegistered();
  }

  onMediaProviderSettingsUpdated(existingSettings: object, updatedSettings: object): void {
    this.mediaLibraryService.onProviderSettingsUpdated(existingSettings, updatedSettings);
  }
}

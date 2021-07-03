import {IMediaProvider} from '../../interfaces';

import MediaLocalLibraryService from './media-local-library.service';
import MediaLocalPlaybackService from './media-local-playback.service';
import MediaLocalSettingsService from './media-local-settings.service';
import MediaLocalConstants from './media-local.constants.json';

import {
  IMediaLocalLibraryService,
  IMediaLocalPlaybackService,
  IMediaLocalSettingsService,
} from './media-local.interfaces';

export class MediaLocalProvider implements IMediaProvider {
  readonly mediaProviderIdentifier = MediaLocalConstants.Provider;
  readonly mediaLibraryService: IMediaLocalLibraryService;
  readonly mediaPlaybackService: IMediaLocalPlaybackService;
  readonly mediaSettingsService: IMediaLocalSettingsService;

  constructor() {
    this.mediaLibraryService = MediaLocalLibraryService;
    this.mediaPlaybackService = MediaLocalPlaybackService;
    this.mediaSettingsService = MediaLocalSettingsService;
  }
}

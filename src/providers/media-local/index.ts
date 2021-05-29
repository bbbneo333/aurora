import {
  IMediaLibraryService,
  IMediaPlaybackService,
  IMediaProvider,
} from '../../interfaces';

import {MediaLocalLibraryService} from './media-local-library.service';
import {MediaLocalPlaybackService} from './media-local-playback.service';
import MediaLocalConstants from './media-local.constants.json';

export class MediaLocalProvider implements IMediaProvider {
  readonly mediaProviderNamespace = MediaLocalConstants.Provider;
  readonly mediaLibraryService: IMediaLibraryService;
  readonly mediaPlaybackService: IMediaPlaybackService;

  constructor() {
    this.mediaLibraryService = new MediaLocalLibraryService();
    this.mediaPlaybackService = new MediaLocalPlaybackService();
  }
}

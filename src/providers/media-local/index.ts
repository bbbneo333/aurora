import {
  IMediaLibraryService,
  IMediaPlaybackService,
  IMediaProvider,
} from '../../interfaces';

import {MediaLocalLibraryService} from './media-local-library.service';
import {MediaLocalPlaybackService} from './media-local-playback.service';

export class MediaLocalProvider implements IMediaProvider {
  readonly mediaProviderNamespace = 'media_local';
  readonly mediaLibraryService: IMediaLibraryService;
  readonly mediaPlaybackService: IMediaPlaybackService;

  constructor() {
    this.mediaLibraryService = new MediaLocalLibraryService();
    this.mediaPlaybackService = new MediaLocalPlaybackService();
  }
}

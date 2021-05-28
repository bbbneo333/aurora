import {
  IMediaPlayback,
  IMediaPlaybackOptions,
  IMediaPlaybackService,
} from '../../interfaces';

import {MediaLocalPlayback} from './media-local-playback.model';
import {MediaLocalTrack} from './media-local-track.model';

export class MediaLocalPlaybackService implements IMediaPlaybackService {
  playMediaTrack(mediaTrack: MediaLocalTrack, mediaPlaybackOptions: IMediaPlaybackOptions): IMediaPlayback {
    return new MediaLocalPlayback(mediaTrack, mediaPlaybackOptions);
  }
}

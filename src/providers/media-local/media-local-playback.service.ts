import {
  IMediaTrack,
  IMediaPlayback,
  IMediaPlaybackOptions,
  IMediaPlaybackService,
} from '../../interfaces';

import {MediaPlayback} from './media-playback';

export class MediaLocalPlaybackService implements IMediaPlaybackService {
  playMediaTrack(mediaTrack: IMediaTrack, mediaPlaybackOptions: IMediaPlaybackOptions): IMediaPlayback {
    return new MediaPlayback(mediaTrack, mediaPlaybackOptions);
  }
}

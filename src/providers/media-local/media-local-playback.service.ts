import { IMediaPlayback, IMediaPlaybackOptions, IMediaPlaybackService } from '../../interfaces';

import { IMediaLocalTrack } from './media-local.interfaces';
import { MediaLocalPlayback } from './media-local-playback.model';

class MediaLocalPlaybackService implements IMediaPlaybackService {
  playMediaTrack(mediaTrack: IMediaLocalTrack, mediaPlaybackOptions: IMediaPlaybackOptions): IMediaPlayback {
    return new MediaLocalPlayback(mediaTrack, mediaPlaybackOptions);
  }
}

export default new MediaLocalPlaybackService();

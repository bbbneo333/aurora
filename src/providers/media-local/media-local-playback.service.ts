import {IMediaPlayback, IMediaPlaybackOptions} from '../../interfaces';

import {IMediaLocalPlaybackService, IMediaLocalTrack} from './media-local.interfaces';
import {MediaLocalPlayback} from './media-local-playback.model';

class MediaLocalPlaybackService implements IMediaLocalPlaybackService {
  playMediaTrack(mediaTrack: IMediaLocalTrack, mediaPlaybackOptions: IMediaPlaybackOptions): IMediaPlayback {
    return new MediaLocalPlayback(mediaTrack, mediaPlaybackOptions);
  }
}

export default new MediaLocalPlaybackService();

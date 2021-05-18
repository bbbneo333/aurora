import {MediaTrack} from '../models';
import {MediaEnums} from '../enums';

import MediaPlayerLocalService from './media-player-local.service';
import store from '../store';

const debug = require('debug')('app:service:media_player_service');

class MediaPlayerService {
  playMediaTrack(mediaTrack: MediaTrack): void {
    const {mediaPlayer} = store.getState();

    if (mediaPlayer.mediaPlaybackCurrentMediaTrack) {
      // resume media player if we are playing same track
      if (mediaPlayer.mediaPlaybackCurrentMediaTrack.id === mediaTrack.id) {
        debug('playMediaTrack - resuming - media track id - %s', mediaPlayer.mediaPlaybackCurrentMediaTrack.id);
        MediaPlayerLocalService.resumePlayer();
        return;
      }

      // stop media player
      debug('playMediaTrack - stopping - media track id - %s', mediaPlayer.mediaPlaybackCurrentMediaTrack.id);
      MediaPlayerLocalService.stopPlayer();
    }

    // playing a new media track would always clear off the queue
    store.dispatch({
      type: MediaEnums.MediaPlayerActions.ClearTracks,
    });

    // add track to the queue
    store.dispatch({
      type: MediaEnums.MediaPlayerActions.AddTrack,
      data: {
        mediaTrack,
      },
    });

    // request media player to play the track
    debug('playMediaTrack - playing - media track id - %s', mediaTrack.id);
    MediaPlayerLocalService.playMediaTrack(mediaTrack);
  }

  seekMediaTrack(mediaTrackSeekPosition: number): void {
    const {mediaPlayer} = store.getState();

    if (!mediaPlayer.mediaPlaybackCurrentMediaTrack || mediaPlayer.mediaPlaybackCurrentMediaProgress === mediaTrackSeekPosition) {
      return;
    }

    MediaPlayerLocalService.seekMediaTrack(mediaTrackSeekPosition);
  }

  pauseMediaPlayer(): void {
    const {mediaPlayer} = store.getState();

    if (!mediaPlayer.mediaPlaybackCurrentMediaTrack) {
      return;
    }

    MediaPlayerLocalService.pausePlayer();
  }

  resumeMediaPlayer(): void {
    const {mediaPlayer} = store.getState();

    if (!mediaPlayer.mediaPlaybackCurrentMediaTrack) {
      return;
    }

    MediaPlayerLocalService.resumePlayer();
  }

  stopMediaPlayer(): void {
    const {mediaPlayer} = store.getState();

    if (!mediaPlayer.mediaPlaybackCurrentMediaTrack) {
      return;
    }

    MediaPlayerLocalService.stopPlayer();
  }
}

export default new MediaPlayerService();

import React, {useEffect} from 'react';
import {useSelector} from 'react-redux';

import {MediaEnums} from '../../enums';
import {RootState} from '../../reducers';
import {MediaPlayerService} from '../../services';

const debug = require('debug')('app:component:media_session_component');

export function MediaSessionComponent() {
  const mediaPlayer = useSelector((state: RootState) => state.mediaPlayer);

  useEffect(() => {
    if (!navigator.mediaSession) {
      return;
    }

    const {mediaSession} = navigator;

    debug('registering media action handlers');

    mediaSession.setActionHandler('play', () => {
      debug('received action - %s', 'play');
      MediaPlayerService.resumeMediaPlayer();
      mediaSession.playbackState = 'playing';
    });

    mediaSession.setActionHandler('pause', () => {
      debug('received action - %s', 'pause');
      MediaPlayerService.pauseMediaPlayer();
      mediaSession.playbackState = 'paused';
    });

    mediaSession.setActionHandler('stop', () => {
      debug('received action - %s', 'stop');
      MediaPlayerService.stopMediaPlayer();
      mediaSession.playbackState = 'none';
    });

    mediaSession.setActionHandler('seekto', (event) => {
      debug('received action - %s, fast seek? %s, seek time - %f', 'seekto', event.fastSeek, event.seekTime);
      MediaPlayerService.seekMediaTrack(event.seekTime);
    });

    navigator.mediaSession.setActionHandler('seekbackward', (event) => {
      debug('received action - %s, seek offset - %f', 'seekbackward', event.seekOffset);
      // TODO: Add support for seeking backwards with provided offset
    });

    navigator.mediaSession.setActionHandler('seekforward', (event) => {
      debug('received action - %s, seek offset - %f', 'seekforward', event.seekOffset);
      // TODO: Add support for seeking forwards with provided offset
    });

    mediaSession.setActionHandler('previoustrack', () => {
      debug('received action - %s', 'previoustrack');
      MediaPlayerService.playPreviousTrack();
    });

    mediaSession.setActionHandler('nexttrack', () => {
      debug('received action - %s', 'nexttrack');
      MediaPlayerService.playNextTrack();
    });
  }, []);

  useEffect(() => {
    if (!navigator.mediaSession
      || mediaPlayer.mediaPlaybackState !== MediaEnums.MediaPlaybackState.Playing
      || !mediaPlayer.mediaPlaybackCurrentMediaTrack) {
      return;
    }

    const mediaTrack = mediaPlayer.mediaPlaybackCurrentMediaTrack;
    const mediaSessionMetadata = new MediaMetadata({
      title: mediaTrack.track_name,
      artist: mediaTrack.track_album.album_artist.artist_name,
      album: mediaTrack.track_album.album_name,
      artwork: [],
    });

    debug('updating metadata - %o', mediaSessionMetadata);

    navigator.mediaSession.metadata = mediaSessionMetadata;
  }, [
    mediaPlayer.mediaPlaybackCurrentMediaTrack,
    mediaPlayer.mediaPlaybackState,
  ]);

  useEffect(() => {
    if (!navigator.mediaSession
      || !navigator.mediaSession.setPositionState
      || !mediaPlayer.mediaPlaybackCurrentMediaTrack
      || mediaPlayer.mediaPlaybackState !== MediaEnums.MediaPlaybackState.Playing) {
      return;
    }

    const mediaSessionPlaybackState = {
      duration: mediaPlayer.mediaPlaybackCurrentMediaTrack.track_duration,
      playbackRate: 1.0,
      position: mediaPlayer.mediaPlaybackCurrentMediaProgress,
    };

    debug('updating position state - %o', mediaSessionPlaybackState);

    navigator.mediaSession.setPositionState(mediaSessionPlaybackState);
  }, [
    mediaPlayer.mediaPlaybackState,
    mediaPlayer.mediaPlaybackCurrentMediaTrack,
    mediaPlayer.mediaPlaybackCurrentMediaProgress,
  ]);

  // important - this component does not renders anything
  return (
    <></>
  );
}

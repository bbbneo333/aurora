import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { AppEnums, MediaEnums } from '../../enums';
import { RootState } from '../../reducers';
import { MediaPlayerService } from '../../services';
import { IMediaTrack } from '../../interfaces';
import { IPCService } from '../../modules/ipc';

const debug = require('debug')('app:component:media_session_component');

const getSessionArtworkForMediaTrack = (mediaTrack: IMediaTrack): MediaImage | undefined => {
  const mediaTrackPicture = mediaTrack.track_cover_picture;
  if (!mediaTrackPicture) {
    return undefined;
  }

  let mediaTrackPictureBuffer: Buffer;

  switch (mediaTrackPicture?.image_data_type) {
    case MediaEnums.MediaTrackCoverPictureImageDataType.Path: {
      const image = IPCService.sendSyncMessage(AppEnums.IPCCommChannels.FSReadFile, mediaTrackPicture.image_data);
      mediaTrackPictureBuffer = Buffer.from(image);
      break;
    }
    case MediaEnums.MediaTrackCoverPictureImageDataType.Buffer: {
      mediaTrackPictureBuffer = mediaTrackPicture.image_data;
      break;
    }
    default: {
      throw new Error(`MediaSession encountered error at getSessionArtworkForMediaTrack - Unsupported image data type - ${mediaTrackPicture.image_data_type}`);
    }
  }

  const base64Image = mediaTrackPictureBuffer.toString('base64');
  const dataUri = `data:image/png;base64,${base64Image}`;

  return {
    src: dataUri,
  };
};

export function MediaSession() {
  const mediaPlayer = useSelector((state: RootState) => state.mediaPlayer);
  const { mediaSession } = navigator;

  useEffect(() => {
    if (!mediaSession) {
      return;
    }

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

    mediaSession.setActionHandler('seekbackward', (event) => {
      debug('received action - %s, seek offset - %f', 'seekbackward', event.seekOffset);
      // TODO: Add support for seeking backwards with provided offset
    });

    mediaSession.setActionHandler('seekforward', (event) => {
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
  }, [
    mediaSession,
  ]);

  useEffect(() => {
    if (!mediaSession
      || mediaPlayer.mediaPlaybackState !== MediaEnums.MediaPlaybackState.Playing
      || !mediaPlayer.mediaPlaybackCurrentMediaTrack) {
      return;
    }

    const mediaTrack = mediaPlayer.mediaPlaybackCurrentMediaTrack;
    const mediaTrackArtwork = getSessionArtworkForMediaTrack(mediaTrack);

    const mediaSessionMetadata = new MediaMetadata({
      title: mediaTrack.track_name,
      artist: mediaTrack.track_album.album_artist.artist_name,
      album: mediaTrack.track_album.album_name,
      artwork: mediaTrackArtwork && [mediaTrackArtwork],
    });

    debug('updating metadata - %o', mediaSessionMetadata);

    mediaSession.metadata = mediaSessionMetadata;
  }, [
    mediaSession,
    mediaPlayer.mediaPlaybackCurrentMediaTrack,
    mediaPlayer.mediaPlaybackState,
  ]);

  useEffect(() => {
    if (!mediaSession
      || !mediaSession.setPositionState
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

    mediaSession.setPositionState(mediaSessionPlaybackState);
  }, [
    mediaSession,
    mediaPlayer.mediaPlaybackState,
    mediaPlayer.mediaPlaybackCurrentMediaTrack,
    mediaPlayer.mediaPlaybackCurrentMediaProgress,
  ]);

  // important - this component does not render anything
  return (
    <></>
  );
}

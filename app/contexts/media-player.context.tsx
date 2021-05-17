import React, {createContext} from 'react';
import {useDispatch, useSelector} from 'react-redux';

import {MediaEnums} from '../enums';
import {MediaTrack} from '../models';
import {RootState} from '../reducers';
import {MediaService} from '../services';

const debug = require('debug')('app:context:media_player_context');

export interface MediaPlayer {
  playMediaTrack(mediaTrack: MediaTrack): boolean;

  pausePlayer(): boolean;

  resumePlayer(): boolean;

  stopPlayer(): boolean;
}

export type MediaPlayerManager = {
  playMediaTrack(mediaTrack: MediaTrack): void;
  resumeMediaPlayer(): void;
  pauseMediaPlayer(): void;
  stopMediaPlayer(): void;
};

export const MediaPlayerContext = createContext<{
  mediaPlayerManager: MediaPlayerManager,
} | null>(null);

export function MediaPlayerProvider(props: { children: React.ReactNode; }) {
  const {children} = props;
  const mediaPlayer = useSelector((state: RootState) => state.mediaPlayer);
  const dispatch = useDispatch();

  const mediaPlayerLocal: MediaPlayer = {
    playMediaTrack(mediaTrack: MediaTrack): boolean {
      // run and store a new audio instance
      const mediaPlaybackLocalAudio = MediaService.playLocalAudio(mediaTrack.location.address, {
        onplay: (mediaPlaybackAudioId: number) => {
          debug('playMediaTrack - audio %s - playback id - %d', 'played', mediaPlaybackAudioId);
          dispatch({
            type: MediaEnums.MediaPlayerActions.Play,
          });
        },
        onpause: (mediaPlaybackAudioId: number) => {
          debug('playMediaTrack - audio %s - playback id - %d', 'paused', mediaPlaybackAudioId);
          dispatch({
            type: MediaEnums.MediaPlayerActions.PausePlayer,
          });
        },
        onstop: (mediaPlaybackAudioId: number) => {
          debug('playMediaTrack - audio %s - playback id - %d', 'stopped', mediaPlaybackAudioId);
        },
        onend: (mediaPlaybackAudioId: number) => {
          debug('playMediaTrack - audio %s - playback id - %d', 'ended', mediaPlaybackAudioId);
        },
        onseek: (mediaPlaybackAudioId: number) => {
          const mediaSeek = 0;
          debug('playMediaTrack - audio %s - playback id - %d, seek - %d', 'seeked', mediaPlaybackAudioId, mediaSeek);
        },
      });

      dispatch({
        type: MediaEnums.MediaPlayerActions.LoadTrack,
        data: {
          mediaTrackId: mediaTrack.id,
          mediaPlayingInstance: {
            audio: mediaPlaybackLocalAudio,
          },
        },
      });

      // play returns a unique sound ID that can be passed
      // into any method on Howl to control that specific sound
      const audioPlaybackId = mediaPlaybackLocalAudio.play();
      debug('playMediaTrack - playing track id - %s, playback id - %d', mediaTrack.id, audioPlaybackId);

      return true;
    },
    pausePlayer(): boolean {
      if (!mediaPlayer.mediaPlaybackCurrentPlayingInstance) {
        return false;
      }

      mediaPlayer.mediaPlaybackCurrentPlayingInstance.audio.pause();
      dispatch({
        type: MediaEnums.MediaPlayerActions.PausePlayer,
      });

      return true;
    },
    resumePlayer(): boolean {
      if (!mediaPlayer.mediaPlaybackCurrentPlayingInstance) {
        return false;
      }

      mediaPlayer.mediaPlaybackCurrentPlayingInstance.audio.play();
      dispatch({
        type: MediaEnums.MediaPlayerActions.Play,
      });

      return true;
    },
    stopPlayer(): boolean {
      if (!mediaPlayer.mediaPlaybackCurrentPlayingInstance) {
        return false;
      }

      mediaPlayer.mediaPlaybackCurrentPlayingInstance.audio.stop();
      mediaPlayer.mediaPlaybackCurrentPlayingInstance.audio.off();
      dispatch({
        type: MediaEnums.MediaPlayerActions.StopPlayer,
      });

      return true;
    },
  };

  const mediaPlayerManager: MediaPlayerManager = {
    playMediaTrack(mediaTrack: MediaTrack): void {
      if (mediaPlayer.mediaPlaybackCurrentMediaTrack) {
        // resume media player if we are playing same track
        if (mediaPlayer.mediaPlaybackCurrentMediaTrack.id === mediaTrack.id) {
          debug('playMediaTrack - resuming - media track id - %s', mediaPlayer.mediaPlaybackCurrentMediaTrack.id);
          mediaPlayerLocal.resumePlayer();
          return;
        }

        // stop media player
        debug('playMediaTrack - stopping - media track id - %s', mediaPlayer.mediaPlaybackCurrentMediaTrack.id);
        mediaPlayerLocal.stopPlayer();
      }

      // playing a new media track would always clear off the queue
      dispatch({
        type: MediaEnums.MediaPlayerActions.ClearTracks,
      });

      // add track to the queue
      dispatch({
        type: MediaEnums.MediaPlayerActions.AddTrack,
        data: {
          mediaTrack,
        },
      });

      // request media player to play the track
      debug('playMediaTrack - playing - media track id - %s', mediaTrack.id);
      mediaPlayerLocal.playMediaTrack(mediaTrack);
    },
    pauseMediaPlayer(): void {
      if (!mediaPlayer.mediaPlaybackCurrentMediaTrack) {
        return;
      }

      mediaPlayerLocal.pausePlayer();
    },
    resumeMediaPlayer(): void {
      if (!mediaPlayer.mediaPlaybackCurrentMediaTrack) {
        return;
      }

      mediaPlayerLocal.resumePlayer();
    },
    stopMediaPlayer(): void {
      if (!mediaPlayer.mediaPlaybackCurrentMediaTrack) {
        return;
      }

      mediaPlayerLocal.stopPlayer();
    },
  };

  const provider = {
    mediaPlayerManager,
  };

  return (
    <MediaPlayerContext.Provider value={provider}>
      {children}
    </MediaPlayerContext.Provider>
  );
}

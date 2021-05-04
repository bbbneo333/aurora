import React, {createContext, useContext} from 'react';
import {useDispatch, useSelector} from 'react-redux';

import {MediaEnums} from '../enums';
import {MediaTrack} from '../models';
import {RootState} from '../reducers';

import {AppContext} from './app.context';

const debug = require('debug')('app:context:media_player_context');

export type MediaPlayerManager = {
  playMediaTrack(mediaTrack: MediaTrack): void;
  pauseMediaPlayer(): void;
  stopMediaPlayer(): void;
};

export const MediaPlayerContext = createContext<{
  mediaPlayerManager: MediaPlayerManager,
} | null>(null);

export function MediaPlayerProvider(props: { children: React.ReactNode; }) {
  const {children} = props;
  const appContext = useContext(AppContext);
  const mediaPlayer = useSelector((state: RootState) => state.mediaPlayer);
  const dispatch = useDispatch();

  if (!appContext) {
    throw new Error('MediaPlaybackProvider encountered error - Missing context - AppContext');
  }

  const {
    mediaService,
  } = appContext;

  const mediaPlayerLocal = {
    playMediaTrack(mediaTrack: MediaTrack) {
      // run and store a new audio instance
      const mediaPlaybackLocalAudio = mediaService.playLocalAudio(mediaTrack.location.address, {
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

          // only issue stop when current playing instance is as same as the one we have received here
          // there can be a case where a new instance has been already started and older instance stop after that
          // in such case, we will end up stopping the wrong instance
          if (mediaPlayer.mediaPlaybackCurrentPlayingInstance && mediaPlayer.mediaPlaybackCurrentPlayingInstance.audio_playback_id === mediaPlaybackAudioId) {
            dispatch({
              type: MediaEnums.MediaPlayerActions.StopPlayer,
            });
          }
        },
        onend: (mediaPlaybackAudioId: number) => {
          debug('playMediaTrack - audio %s - playback id - %d', 'ended', mediaPlaybackAudioId);
          dispatch({
            type: MediaEnums.MediaPlayerActions.StopPlayer,
          });
        },
      });

      dispatch({
        type: MediaEnums.MediaPlayerActions.LoadTrack,
        data: {
          mediaTrackId: mediaTrack.id,
          mediaPlayingInstance: mediaPlaybackLocalAudio,
        },
      });
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

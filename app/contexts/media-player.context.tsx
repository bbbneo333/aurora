import React, {createContext, useContext} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import * as _ from 'lodash';

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

  const mediaPlayerManager: MediaPlayerManager = {
    playMediaTrack(mediaTrack: MediaTrack): void {
      // stop and remove event handlers (via off) from existing running audio instance if we have any
      if (mediaPlayer.mediaPlaybackCurrentMediaTrack && mediaPlayer.mediaPlaybackCurrentMediaAudio) {
        // check if it's the same media track
        if (mediaPlayer.mediaPlaybackCurrentMediaTrack.id === mediaTrack.id) {
          debug('playMediaTrack - resuming - media track id - %s, playback id - %d', mediaPlayer.mediaPlaybackCurrentMediaTrack.id, mediaPlayer.mediaPlaybackCurrentMediaAudio.audio_playback_id);

          mediaPlayer.mediaPlaybackCurrentMediaAudio.audio.play();
          dispatch({
            type: MediaEnums.MediaPlayerActions.Play,
            data: {
              mediaAudio: mediaPlayer.mediaPlaybackCurrentMediaAudio,
            },
          });
          return;
        }

        debug('playMediaTrack - unloading - media track id - %s, playback id - %d', mediaPlayer.mediaPlaybackCurrentMediaTrack, mediaPlayer.mediaPlaybackCurrentMediaAudio.audio_playback_id);

        mediaPlayer.mediaPlaybackCurrentMediaAudio.audio.stop();
        mediaPlayer.mediaPlaybackCurrentMediaAudio.audio.off();
        dispatch({
          type: MediaEnums.MediaPlayerActions.Stop,
        });
      }

      // playing a new media track would always clear off the queue
      dispatch({
        type: MediaEnums.MediaPlayerActions.ClearTracks,
      });

      // add track to the queue and set state as loading with the new media track for the player
      dispatch({
        type: MediaEnums.MediaPlayerActions.AddTrack,
        data: {
          mediaTrack,
        },
      });
      dispatch({
        type: MediaEnums.MediaPlayerActions.PlayTrack,
        data: {
          mediaTrackId: mediaTrack.id,
        },
      });

      // run and store a new audio instance
      const mediaAudio = mediaService.playLocalAudio(mediaTrack.location.address, {
        onplay: (mediaPlaybackAudioId: number) => {
          debug('playMediaTrack - audio %s - playback id - %d', 'played', mediaPlaybackAudioId);
          dispatch({
            type: MediaEnums.MediaPlayerActions.Play,
            data: {
              mediaAudio,
            },
          });
        },
        onpause: (mediaPlaybackAudioId: number) => {
          debug('playMediaTrack - audio %s - playback id - %d', 'paused', mediaPlaybackAudioId);
          dispatch({
            type: MediaEnums.MediaPlayerActions.Pause,
          });
        },
        onstop: (mediaPlaybackAudioId: number) => {
          debug('playMediaTrack - audio %s - playback id - %d', 'stopped', mediaPlaybackAudioId);

          // only issue stop when current playing instance is as same as the one we have received here
          // there can be a case where a new instance has been already started and older instance stop after that
          // in such case, we will end up stopping the wrong instance
          if (mediaPlayer.mediaPlaybackCurrentMediaAudio && mediaPlayer.mediaPlaybackCurrentMediaAudio.audio_playback_id === mediaPlaybackAudioId) {
            dispatch({
              type: MediaEnums.MediaPlayerActions.Stop,
            });
          }
        },
        onend: (mediaPlaybackAudioId: number) => {
          debug('playMediaTrack - audio %s - playback id - %d', 'ended', mediaPlaybackAudioId);
          dispatch({
            type: MediaEnums.MediaPlayerActions.Stop,
          });
        },
      });

      debug('playMediaTrack - loaded - media track id - %s, playback id - %d', mediaTrack.id, mediaAudio.audio_playback_id);
    },
    pauseMediaPlayer(): void {
      if (_.isNil(mediaPlayer.mediaPlaybackCurrentMediaAudio)) {
        return;
      }

      mediaPlayer.mediaPlaybackCurrentMediaAudio.audio.pause();
      dispatch({
        type: MediaEnums.MediaPlayerActions.Pause,
      });
    },
    stopMediaPlayer(): void {
      if (!mediaPlayer.mediaPlaybackCurrentMediaAudio) {
        return;
      }

      mediaPlayer.mediaPlaybackCurrentMediaAudio.audio.stop();
      mediaPlayer.mediaPlaybackCurrentMediaAudio.audio.off();
      dispatch({
        type: MediaEnums.MediaPlayerActions.Stop,
      });
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

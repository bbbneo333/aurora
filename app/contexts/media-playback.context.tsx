import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useState,
} from 'react';

import * as _ from 'lodash';
import {Howl} from 'howler';

import {MediaEnums} from '../enums';
import {IMediaItem, IMediaItemPlaybackQueueManageAction} from '../interfaces';
import {MediaService} from '../services';

import {AppContext} from './app.context';

const debug = require('debug')('app:context:media_playback_context');

function mediaItemReducer(state: IMediaItem[], action: {
  type: MediaEnums.MediaPlaybackQueueActions,
  data?: any,
}): IMediaItem[] {
  switch (action.type) {
    case MediaEnums.MediaPlaybackQueueActions.CLEAR:
      return [];
    case MediaEnums.MediaPlaybackQueueActions.ADD_TRACK:
      return [...state, action.data];
    case MediaEnums.MediaPlaybackQueueActions.REMOVE_TRACK:
      return _.filter(state, mediaItem => mediaItem.id !== action.data);
    default:
      return state;
  }
}

export class MediaPlaybackManager {
  private readonly mediaService: MediaService;
  private readonly mediaItemPlaybackQueueManager: React.Dispatch<IMediaItemPlaybackQueueManageAction>;
  public mediaPlaybackCurrentAudio?: { audio: Howl, audio_playback_id: number };
  public mediaPlaybackCurrentMediaItem?: IMediaItem;
  public mediaPlaybackState = MediaEnums.MediaPlaybackState.Idle;

  constructor(ctx: {
    mediaService: MediaService,
    mediaItemPlaybackQueueManager: React.Dispatch<IMediaItemPlaybackQueueManageAction>,
  }) {
    this.mediaService = ctx.mediaService;
    this.mediaItemPlaybackQueueManager = ctx.mediaItemPlaybackQueueManager;
  }

  playMediaItem(mediaItem: IMediaItem): void {
    // stop and remove event handlers (via off) from existing running audio instance if we have any
    if (this.mediaPlaybackCurrentAudio) {
      debug('playMediaItem - unloading - playback id - %d', this.mediaPlaybackCurrentAudio.audio_playback_id);

      this.mediaPlaybackCurrentAudio.audio.stop();
      this.mediaPlaybackCurrentAudio.audio.off();
      this.mediaPlaybackCurrentAudio = undefined;
    }

    // TODO: FixMe - This is causing an issue where new instance of MediaPlaybackManager is been created
    // playing a new media item would always clear off the queue
    this.mediaItemPlaybackQueueManager({
      type: MediaEnums.MediaPlaybackQueueActions.CLEAR,
    });

    // set state as loading with the new media item for the player
    this.mediaPlaybackCurrentMediaItem = mediaItem;
    this.mediaPlaybackState = MediaEnums.MediaPlaybackState.Loading;

    // run and store a new audio instance
    const mediaPlaybackAudio = this.mediaService.playLocalAudio(mediaItem.location.address, {
      onplay: (mediaPlaybackAudioId) => {
        debug('playMediaItem - audio %s - playback id - %d', 'played', mediaPlaybackAudioId);
        this.mediaPlaybackState = MediaEnums.MediaPlaybackState.Playing;
      },
      onpause: (mediaPlaybackAudioId) => {
        debug('playMediaItem - audio %s - playback id - %d', 'paused', mediaPlaybackAudioId);
        this.mediaPlaybackState = MediaEnums.MediaPlaybackState.Paused;
      },
      onstop: (mediaPlaybackAudioId) => {
        debug('playMediaItem - audio %s - playback id - %d', 'stopped', mediaPlaybackAudioId);
        this.mediaPlaybackState = MediaEnums.MediaPlaybackState.Idle;
      },
      onend: (mediaPlaybackAudioId) => {
        debug('playMediaItem - audio %s - playback id - %d', 'ended', mediaPlaybackAudioId);
        this.mediaPlaybackState = MediaEnums.MediaPlaybackState.Idle;
      },
    });
    this.mediaPlaybackCurrentAudio = mediaPlaybackAudio;

    // TODO: FixMe - This is causing an issue where new instance of MediaPlaybackManager is been created
    this.mediaItemPlaybackQueueManager({
      type: MediaEnums.MediaPlaybackQueueActions.ADD_TRACK,
      data: mediaItem,
    });

    debug('playMediaItem - loaded - media item id - %s, playback id - %d', mediaItem.id, mediaPlaybackAudio.audio_playback_id);
  }

  pauseMediaPlayer(): void {
    if (_.isNil(this.mediaPlaybackCurrentAudio)) {
      return;
    }

    this.mediaPlaybackCurrentAudio.audio.pause();
  }
}

export function useMediaItemPlaybackStatus(mediaPlaybackManager: MediaPlaybackManager, mediaItem: IMediaItem) {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  useEffect(() => {
    setIsPlaying(mediaPlaybackManager.mediaPlaybackState === MediaEnums.MediaPlaybackState.Playing
      && !_.isNil(mediaPlaybackManager.mediaPlaybackCurrentMediaItem)
      && mediaPlaybackManager.mediaPlaybackCurrentMediaItem.id === mediaItem.id);
  }, [
    mediaPlaybackManager.mediaPlaybackState,
    mediaPlaybackManager.mediaPlaybackCurrentMediaItem,
    mediaItem.id,
  ]);

  return isPlaying;
}

export const MediaPlaybackContext = createContext<{
  mediaItemPlaybackQueue: IMediaItem[],
  mediaPlaybackManager: MediaPlaybackManager,
} | null>(null);

export function MediaPlaybackProvider(props: { children: React.ReactNode; }) {
  const {children} = props;
  const mediaItemPlaybackQueueStore: IMediaItem[] = [];
  const appContext = useContext(AppContext);
  const [mediaItemPlaybackQueue, mediaItemPlaybackQueueManager] = useReducer(mediaItemReducer, mediaItemPlaybackQueueStore);

  if (!appContext) {
    throw new Error('MediaPlaybackProvider encountered error - Missing context - AppContext');
  }
  const {
    mediaService,
  } = appContext;

  const mediaPlaybackManager = new MediaPlaybackManager({
    mediaService,
    mediaItemPlaybackQueueManager,
  });

  const provider = {
    mediaItemPlaybackQueue,
    mediaPlaybackManager,
  };

  return (
    <MediaPlaybackContext.Provider value={provider}>
      {children}
    </MediaPlaybackContext.Provider>
  );
}

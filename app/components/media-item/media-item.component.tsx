import React, {useContext} from 'react';

import {AppContext, MediaLibraryContext, MediaPlaybackContext} from '../../contexts';
import {MediaPlaybackManager, useMediaItemPlaybackStatus} from '../../contexts/media-playback.context';
import {IMediaItem} from '../../interfaces';

function MediaItemPlaybackButtonComponent(props: {
  mediaItem: IMediaItem,
  mediaPlaybackManager: MediaPlaybackManager,
}) {
  const {
    mediaItem,
    mediaPlaybackManager,
  } = props;

  const isMediaItemPlaying = useMediaItemPlaybackStatus(mediaPlaybackManager, mediaItem);

  return (
    isMediaItemPlaying
      ? (
        <button
          type="submit"
          onClick={() => mediaPlaybackManager.pauseMediaPlayer()}
        >
          <i className="fas fa-pause"/>
        </button>
      )
      : (
        <button
          type="submit"
          onClick={() => mediaPlaybackManager.playMediaItem(mediaItem)}
        >
          <i className="fas fa-play-circle"/>
        </button>
      )
  );
}

export function MediaItemComponent(props: {
  mediaItem: IMediaItem,
}) {
  const appContext = useContext(AppContext);
  const mediaLibraryContext = useContext(MediaLibraryContext);
  const mediaPlaybackContext = useContext(MediaPlaybackContext);
  if (!appContext) {
    throw new Error('MediaItemComponent encountered error - Missing context - AppContext');
  }
  if (!mediaLibraryContext) {
    throw new Error('MediaItemComponent encountered error - Missing context - MediaLibraryContext');
  }
  if (!mediaPlaybackContext) {
    throw new Error('MediaItemComponent encountered error - Missing context - MediaPlaybackContext');
  }
  const {mediaItem} = props;
  const {i18nService} = appContext;
  const {mediaLibraryManager} = mediaLibraryContext;
  const {
    mediaPlaybackManager,
  } = mediaPlaybackContext;

  return (
    <li>
      <MediaItemPlaybackButtonComponent
        mediaItem={mediaItem}
        mediaPlaybackManager={mediaPlaybackManager}
      />
      {mediaItem.track_name}
      <button
        type="submit"
        onClick={() => mediaLibraryManager.removeMediaItemFromLibrary(mediaItem)}
      >
        {i18nService.getString('action_remove_track')}
      </button>
    </li>
  );
}

import React, {useContext} from 'react';
import {useSelector} from 'react-redux';

import {AppContext, MediaLibraryContext, MediaPlaybackContext} from '../../contexts';
import {MediaEnums} from '../../enums';
import {MediaTrack} from '../../models';
import {RootState} from '../../reducers';

export function MediaTrackComponent(props: {
  mediaTrack: MediaTrack,
}) {
  const appContext = useContext(AppContext);
  const mediaLibraryContext = useContext(MediaLibraryContext);
  const mediaPlaybackContext = useContext(MediaPlaybackContext);
  const mediaPlayer = useSelector((state: RootState) => state.mediaPlayer);

  if (!appContext) {
    throw new Error('MediaTrackComponent encountered error - Missing context - AppContext');
  }
  if (!mediaLibraryContext) {
    throw new Error('MediaTrackComponent encountered error - Missing context - MediaLibraryContext');
  }
  if (!mediaPlaybackContext) {
    throw new Error('MediaTrackComponent encountered error - Missing context - MediaPlaybackContext');
  }

  const {mediaTrack} = props;
  const {i18nService} = appContext;
  const {mediaLibraryManager} = mediaLibraryContext;
  const {mediaPlaybackManager} = mediaPlaybackContext;

  const isMediaTrackPlaying = mediaPlayer.mediaPlaybackState === MediaEnums.MediaPlayerPlaybackState.Playing
    && mediaPlayer.mediaPlaybackCurrentMediaTrack
    && mediaPlayer.mediaPlaybackCurrentMediaTrack.id === mediaTrack.id;

  return (
    <li>
      {isMediaTrackPlaying
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
            onClick={() => mediaPlaybackManager.playMediaTrack(mediaTrack)}
          >
            <i className="fas fa-play-circle"/>
          </button>
        )}
      {mediaTrack.track_name}
      <button
        type="submit"
        onClick={() => {
          if (isMediaTrackPlaying) {
            mediaPlaybackManager.stopMediaPlayer();
          }

          mediaLibraryManager.removeMediaTrackFromLibrary(mediaTrack);
        }}
      >
        {i18nService.getString('action_remove_track')}
      </button>
    </li>
  );
}

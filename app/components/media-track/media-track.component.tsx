import React, {useContext} from 'react';
import {useSelector} from 'react-redux';

import {AppContext, MediaLibraryContext, MediaPlayerContext} from '../../contexts';
import {MediaEnums} from '../../enums';
import {MediaTrack} from '../../models';
import {RootState} from '../../reducers';

export function MediaTrackComponent(props: {
  mediaTrack: MediaTrack,
}) {
  const appContext = useContext(AppContext);
  const mediaLibraryContext = useContext(MediaLibraryContext);
  const mediaPlayerContext = useContext(MediaPlayerContext);
  const mediaPlayer = useSelector((state: RootState) => state.mediaPlayer);

  if (!appContext) {
    throw new Error('MediaTrackComponent encountered error - Missing context - AppContext');
  }
  if (!mediaLibraryContext) {
    throw new Error('MediaTrackComponent encountered error - Missing context - MediaLibraryContext');
  }
  if (!mediaPlayerContext) {
    throw new Error('MediaTrackComponent encountered error - Missing context - MediaPlayerContext');
  }

  const {mediaTrack} = props;
  const {i18nService} = appContext;
  const {mediaLibraryManager} = mediaLibraryContext;
  const {mediaPlayerManager} = mediaPlayerContext;

  const isMediaTrackPlaying = mediaPlayer.mediaPlaybackState === MediaEnums.MediaPlayerPlaybackState.Playing
    && mediaPlayer.mediaPlaybackCurrentMediaTrack
    && mediaPlayer.mediaPlaybackCurrentMediaTrack.id === mediaTrack.id;

  return (
    <li>
      {isMediaTrackPlaying
        ? (
          <button
            type="submit"
            onClick={() => mediaPlayerManager.pauseMediaPlayer()}
          >
            <i className="fas fa-pause"/>
          </button>
        )
        : (
          <button
            type="submit"
            onClick={() => mediaPlayerManager.playMediaTrack(mediaTrack)}
          >
            <i className="fas fa-play-circle"/>
          </button>
        )}
      {mediaTrack.track_name}
      <button
        type="submit"
        onClick={() => {
          if (isMediaTrackPlaying) {
            mediaPlayerManager.stopMediaPlayer();
          }

          mediaLibraryManager.removeMediaTrackFromLibrary(mediaTrack);
        }}
      >
        {i18nService.getString('action_remove_track')}
      </button>
    </li>
  );
}

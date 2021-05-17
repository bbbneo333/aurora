import React, {useContext} from 'react';
import {useSelector} from 'react-redux';

import {MediaLibraryContext, MediaPlayerContext} from '../../contexts';
import {MediaEnums} from '../../enums';
import {MediaTrack} from '../../models';
import {RootState} from '../../reducers';
import {I18nService} from '../../services';

export function MediaTrackComponent(props: {
  mediaTrack: MediaTrack,
}) {
  const mediaLibraryContext = useContext(MediaLibraryContext);
  const mediaPlayerContext = useContext(MediaPlayerContext);
  const mediaPlayer = useSelector((state: RootState) => state.mediaPlayer);

  if (!mediaLibraryContext) {
    throw new Error('MediaTrackComponent encountered error - Missing context - MediaLibraryContext');
  }
  if (!mediaPlayerContext) {
    throw new Error('MediaTrackComponent encountered error - Missing context - MediaPlayerContext');
  }

  const {mediaTrack} = props;
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
        {I18nService.getString('action_remove_track')}
      </button>
    </li>
  );
}

import React from 'react';
import {useSelector} from 'react-redux';

import {MediaEnums} from '../../enums';
import {MediaTrack} from '../../models';
import {RootState} from '../../reducers';
import {I18nService, MediaLibraryService, MediaPlayerService} from '../../services';

export function MediaTrackComponent(props: {
  mediaTrack: MediaTrack,
}) {
  const mediaPlayer = useSelector((state: RootState) => state.mediaPlayer);

  const {mediaTrack} = props;

  const isMediaTrackPlaying = mediaPlayer.mediaPlaybackState === MediaEnums.MediaPlayerPlaybackState.Playing
    && mediaPlayer.mediaPlaybackCurrentMediaTrack
    && mediaPlayer.mediaPlaybackCurrentMediaTrack.id === mediaTrack.id;

  return (
    <li>
      {isMediaTrackPlaying
        ? (
          <button
            type="submit"
            onClick={() => MediaPlayerService.pauseMediaPlayer()}
          >
            <i className="fas fa-pause"/>
          </button>
        )
        : (
          <button
            type="submit"
            onClick={() => MediaPlayerService.playMediaTrack(mediaTrack)}
          >
            <i className="fas fa-play-circle"/>
          </button>
        )}
      {mediaTrack.track_name}
      <button
        type="submit"
        onClick={() => {
          if (isMediaTrackPlaying) {
            MediaPlayerService.stopMediaPlayer();
          }

          MediaLibraryService.removeMediaTrackFromLibrary(mediaTrack);
        }}
      >
        {I18nService.getString('action_remove_track')}
      </button>
    </li>
  );
}

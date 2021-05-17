import React from 'react';
import {useSelector} from 'react-redux';

import {MediaTrackComponent} from '../../components';
import {RootState} from '../../reducers';
import {I18nService, MediaLibraryService} from '../../services';

export function HomeComponent() {
  const mediaLibrary = useSelector((state: RootState) => state.mediaLibrary);

  return (
    <div>
      <ul>
        {mediaLibrary.mediaTracks.map(mediaTrack => (
          <MediaTrackComponent
            key={mediaTrack.id}
            mediaTrack={mediaTrack}
          />
        ))}
      </ul>
      <button
        type="submit"
        onClick={() => MediaLibraryService.addDirectoryToLibrary()}
      >
        {I18nService.getString('action_add_tracks')}
      </button>
    </div>
  );
}

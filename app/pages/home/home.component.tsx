import React, {useContext} from 'react';
import {useSelector} from 'react-redux';

import {MediaTrackComponent} from '../../components';
import {MediaLibraryContext} from '../../contexts';
import {RootState} from '../../reducers';
import {I18nService} from '../../services';

export function HomeComponent() {
  const mediaLibraryContext = useContext(MediaLibraryContext);
  const mediaLibrary = useSelector((state: RootState) => state.mediaLibrary);

  if (!mediaLibraryContext) {
    throw new Error('HomeComponent encountered error - Missing context - MediaLibraryContext');
  }

  const {
    mediaLibraryManager,
  } = mediaLibraryContext;

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
        onClick={() => mediaLibraryManager.addDirectoryToLibrary()}
      >
        {I18nService.getString('action_add_tracks')}
      </button>
    </div>
  );
}

import React, {useContext} from 'react';
import {useSelector} from 'react-redux';

import {MediaTrackComponent} from '../../components';
import {AppContext, MediaLibraryContext} from '../../contexts';
import {RootState} from '../../reducers';

export function HomeComponent() {
  const appContext = useContext(AppContext);
  const mediaLibraryContext = useContext(MediaLibraryContext);
  const mediaLibrary = useSelector((state: RootState) => state.mediaLibrary);

  if (!appContext) {
    throw new Error('HomeComponent encountered error - Missing context - AppContext');
  }
  if (!mediaLibraryContext) {
    throw new Error('HomeComponent encountered error - Missing context - MediaLibraryContext');
  }

  const {
    i18nService,
  } = appContext;
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
        {i18nService.getString('action_add_tracks')}
      </button>
    </div>
  );
}

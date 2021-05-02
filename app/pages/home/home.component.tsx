import React, {useContext} from 'react';

import {AppContext, MediaLibraryContext} from '../../contexts';
import {MediaItemComponent} from '../../components';
import {IMediaItem} from '../../interfaces';

import './home.component.css';

export function HomeComponent() {
  const appContext = useContext(AppContext);
  const mediaLibraryContext = useContext(MediaLibraryContext);
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
    mediaItems,
  } = mediaLibraryContext;

  return (
    <div>
      <ul>
        {mediaItems.map((mediaItem: IMediaItem) => (
          <MediaItemComponent
            key={mediaItem.id}
            mediaItem={mediaItem}
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

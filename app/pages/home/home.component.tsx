import React, {useContext} from 'react';

import './home.component.css';

import {AppContext, MediaLibraryContext} from '../../contexts';
import {MediaItemComponent} from '../../components';
import {IMediaItem} from '../../interfaces';

export function HomeComponent() {
  const appContext = useContext(AppContext);
  const mediaContext = useContext(MediaLibraryContext);
  if (!appContext) {
    throw new Error('HomeComponent encountered error - Missing context - AppContext');
  }
  if (!mediaContext) {
    throw new Error('HomeComponent encountered error - Missing context - MediaLibraryContext');
  }
  const {i18nService} = appContext;
  const {mediaLibraryManager, mediaItems} = mediaContext;

  return (
    <div>
      <ul style={{paddingLeft: 10, width: '95%'}}>
        {mediaItems.map((mediaItem: IMediaItem) => (
          <MediaItemComponent key={mediaItem.id} mediaItem={mediaItem}/>
        ))}
      </ul>
      <button type="submit" onClick={() => mediaLibraryManager.addTracksFromDirectory()}>
        {i18nService.getString('action_add_tracks')}
      </button>
    </div>
  );
}

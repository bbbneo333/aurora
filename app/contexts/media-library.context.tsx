import React, {createContext, useContext, useReducer} from 'react';

import {mediaItemReducer} from '../reducers';
import {AppContext} from './app.context';
import {IMediaItem, IMediaItemManageAction, IMediaLibraryManager} from '../interfaces';
import {MediaLibraryManager} from '../models';

export const MediaLibraryContext = createContext<{
  mediaLibraryManager: IMediaLibraryManager,
  mediaItemManager: React.Dispatch<IMediaItemManageAction>,
  mediaItems: IMediaItem[],
} | null>(null);

export function MediaLibraryProvider(props: { children: React.ReactNode; }) {
  const {children} = props;
  const mediaItemStore: IMediaItem[] = [];
  const appContext = useContext(AppContext);
  const [mediaItems, mediaItemManager] = useReducer(mediaItemReducer, mediaItemStore);

  if (!appContext) {
    throw new Error('HomeComponent encountered error - Missing context - AppContext');
  }
  const {systemService} = appContext;

  const provider = {
    mediaItems,
    mediaItemManager,
    mediaLibraryManager: new MediaLibraryManager({
      systemService,
      mediaItemManager,
    }),
  };

  return (
    <MediaLibraryContext.Provider value={provider}>
      {children}
    </MediaLibraryContext.Provider>
  );
}

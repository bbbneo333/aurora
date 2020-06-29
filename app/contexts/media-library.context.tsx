import React, {createContext, Dispatch, useReducer} from 'react';

import {IMediaItem} from "../interfaces";
import {MediaEnums} from "../enums";
import {mediaItemReducer} from '../reducers';

const mediaItemStore: IMediaItem[] = [];

export const MediaLibraryContext = createContext<{
  mediaItems: IMediaItem[],
  mediaLibraryManage: Dispatch<{ type: MediaEnums.MediaLibraryActions }>
} | null>(null);

export function MediaLibraryProvider(props: { children: React.ReactNode; }) {
  const [mediaItems, mediaLibraryManage] = useReducer(mediaItemReducer, mediaItemStore);
  const provider = {mediaItems, mediaLibraryManage};

  return (
    <MediaLibraryContext.Provider value={provider}>
      {props.children}
    </MediaLibraryContext.Provider>
  );
}

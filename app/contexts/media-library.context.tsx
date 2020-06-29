import React, {createContext, useReducer} from 'react';

import {mediaItemReducer} from '../reducers';
import {IMediaItem} from "../interfaces";

const defaultMediaItems: IMediaItem[] = [];

export const MediaLibraryContext = createContext([]);

export function MediaLibraryProvider(props: { children: React.ReactNode; }) {
  const [mediaItems] = useReducer(mediaItemReducer, defaultMediaItems);

  return (
    <MediaLibraryContext.Provider value={mediaItems}>
      {props.children}
    </MediaLibraryContext.Provider>
  );
}

import * as React from 'react';
import PropTypes from 'prop-types';

import {IMediaTrack, IMediaTrackList} from '../interfaces';

const mediaTrackListInitialState = {
  mediaTracks: [],
  mediaTrackList: undefined,
};

const MediaTrackListContext = React.createContext<{
  mediaTracks: IMediaTrack[],
  mediaTrackList?: IMediaTrackList,
}>(mediaTrackListInitialState);

export function MediaTrackListProvider(props: {
  children: PropTypes.ReactNodeArray,
  mediaTracks: IMediaTrack[],
  mediaTrackList?: IMediaTrackList,
}) {
  const {
    children,
    mediaTracks,
    mediaTrackList,
  } = props;

  return (
    <MediaTrackListContext.Provider value={{mediaTracks, mediaTrackList}}>
      {children}
    </MediaTrackListContext.Provider>
  );
}

export function useMediaTrackList() {
  const context = React.useContext(MediaTrackListContext);
  if (!context) {
    return mediaTrackListInitialState;
  }
  return context;
}

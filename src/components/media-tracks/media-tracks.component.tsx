import React from 'react';
import { isEmpty } from 'lodash';
// import classNames from 'classnames/bind';

import { MediaTrackListProvider } from '../../contexts';
import { IMediaTrack, IMediaTrackList } from '../../interfaces';
import { generateId } from '../../utils/string.utils';

import { MediaTrack } from '../media-track/media-track.component';

import {
  MediaTrackContextMenu,
  MediaTrackContextMenuItem,
} from '../media-track-context-menu/media-track-context-menu.component';

// import styles from './media-track-list.component.css';
//
// const cx = classNames.bind(styles);

export function MediaTracks(props: {
  mediaTracks: IMediaTrack[],
  mediaTrackList?: IMediaTrackList,
  disableCovers?: boolean,
  disableAlbumLinks?: boolean,
  contextMenuItems?: MediaTrackContextMenuItem[],
}) {
  const {
    mediaTracks,
    mediaTrackList,
    disableCovers = false,
    disableAlbumLinks = false,
    contextMenuItems,
  } = props;

  const contextMenuId = !isEmpty(contextMenuItems) ? generateId() : undefined;

  return (
    <div>
      <div className="row">
        <MediaTrackListProvider
          mediaTracks={mediaTracks}
          mediaTrackList={mediaTrackList}
        >
          {mediaTracks.map((mediaTrack, mediaTrackPointer) => (
            <MediaTrack
              key={mediaTrack.id}
              mediaTrack={mediaTrack}
              mediaTrackPointer={mediaTrackPointer}
              mediaTrackContextMenuId={contextMenuId}
              disableCover={disableCovers}
              disableAlbumLink={disableAlbumLinks}
            />
          ))}
        </MediaTrackListProvider>
      </div>
      {contextMenuId && contextMenuItems && (
        <MediaTrackContextMenu
          id={contextMenuId}
          menuItems={contextMenuItems}
        />
      )}
    </div>
  );
}

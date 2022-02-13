import React from 'react';
// import classNames from 'classnames/bind';

import {MediaTrackListProvider} from '../../contexts';
import {IMediaTrack, IMediaTrackList} from '../../interfaces';

import {MediaTrackComponent} from '../media-track/media-track.component';

// import styles from './media-track-list.component.css';
//
// const cx = classNames.bind(styles);

export function MediaTrackListComponent(props: {
  mediaTracks: IMediaTrack[],
  mediaTrackList?: IMediaTrackList,
  mediaTrackContextMenuId?: string;
  disableCovers?: boolean,
  disableAlbumLinks?: boolean,
}) {
  const {
    mediaTracks,
    mediaTrackList,
    mediaTrackContextMenuId,
    disableCovers = false,
    disableAlbumLinks = false,
  } = props;

  return (
    <div className="row">
      <MediaTrackListProvider
        mediaTracks={mediaTracks}
        mediaTrackList={mediaTrackList}
      >
        {mediaTracks.map((mediaTrack, mediaTrackPointer) => (
          <MediaTrackComponent
            key={mediaTrack.id}
            mediaTrack={mediaTrack}
            mediaTrackPointer={mediaTrackPointer}
            mediaTrackContextMenuId={mediaTrackContextMenuId}
            disableCover={disableCovers}
            disableAlbumLink={disableAlbumLinks}
          />
        ))}
      </MediaTrackListProvider>
    </div>
  );
}

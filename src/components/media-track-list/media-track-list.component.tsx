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
}) {
  const {
    mediaTracks,
    mediaTrackList,
  } = props;

  return (
    <div className="row">
      <MediaTrackListProvider
        mediaTracks={mediaTracks}
        mediaTrackList={mediaTrackList}
      >
        {mediaTracks.map(mediaTrack => (
          <MediaTrackComponent
            key={mediaTrack.id}
            mediaTrack={mediaTrack}
          />
        ))}
      </MediaTrackListProvider>
    </div>
  );
}

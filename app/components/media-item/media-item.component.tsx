import React from 'react';

import {IMediaItem} from '../../interfaces';

export function MediaItemComponent(props: { mediaItem: IMediaItem }) {
  const {mediaItem} = props;

  return (
    <li>
      {mediaItem.track_name}
    </li>
  );
}

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { IMediaTrack } from '../../interfaces';
import { MediaTrack, MediaTrackProps } from '../media-track/media-track.component';

export function MediaTrackListItem<T extends IMediaTrack>(props: MediaTrackProps<T> & {
  sortable?: boolean;
}) {
  const {
    mediaTrack,
    sortable,
  } = props;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: mediaTrack.id,
    disabled: !sortable,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(sortable ? { ...attributes, ...listeners } : {})}
    >
      <MediaTrack {...props}/>
    </div>
  );
}

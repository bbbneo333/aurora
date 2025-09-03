import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useContextMenu as useMenu } from 'react-contexify';

import { IMediaTrack } from '../../interfaces';
import { MediaTrack, MediaTrackProps } from '../media-track/media-track.component';

export function MediaTrackListItem<T extends IMediaTrack>(props: MediaTrackProps<T> & {
  id: string;
  sortable?: boolean;
}) {
  const {
    sortable,
    id,
  } = props;

  const { hideAll } = useMenu();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id,
    disabled: !sortable,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <MediaTrack
      {...props}
      containerRef={setNodeRef}
      containerProps={{
        style,
        ...(sortable ? { ...attributes, ...listeners } : {}),
        onPointerDown: (...args) => {
          // manually hide all the active context menus first, then start drag
          hideAll();
          listeners?.onPointerDown?.call(null, ...args);
        },
      }}
    />
  );
}

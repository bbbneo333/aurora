import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useContextMenu as useMenu } from 'react-contexify';

import { IMediaTrack } from '../../interfaces';
import { MediaTrack, MediaTrackProps } from '../media-track/media-track.component';

export function MediaTrackListItem<T extends IMediaTrack>(props: MediaTrackProps<T> & {
  id: string;
  sortable?: boolean;
  isSelected?: boolean;
  onSelect?: (e: React.MouseEvent) => void;
}) {
  const {
    id,
    sortable = false,
    isSelected = false,
    onSelect,
    containerProps = {},
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
        ...containerProps,
        style,
        ...(sortable ? { ...attributes, ...listeners } : {}),
        'aria-selected': isSelected,
        onPointerDown: (e) => {
          // manually hide all the active context menus first, then start drag
          hideAll();
          listeners?.onPointerDown?.call(null, e);
        },
        onPointerUp: (e) => {
          if (e.button !== 0) return; // ignore right click
          onSelect?.call(null, e);
        },
      }}
    />
  );
}

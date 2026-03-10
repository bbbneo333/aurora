import React, { useMemo } from 'react';

import { IMediaAlbum } from '../../interfaces';
import { MediaCollectionService } from '../../services';

import { MediaCollectionContextMenuItem } from '../media-collection-context-menu/media-collection-context-menu.component';
import { MediaCollectionGrid } from '../media-collection-grid/media-collection-grid.component';

export function MediaAlbums(props: {
  mediaAlbums: IMediaAlbum[],
}) {
  const { mediaAlbums } = props;

  const mediaItems = useMemo(() => mediaAlbums.map(MediaCollectionService.getMediaItemFromAlbum), [
    mediaAlbums,
  ]);

  return (
    <MediaCollectionGrid
      items={mediaItems}
      contextMenuItems={[
        MediaCollectionContextMenuItem.AddToQueue,
        MediaCollectionContextMenuItem.AddToPlaylist,
      ]}
    />
  );
}

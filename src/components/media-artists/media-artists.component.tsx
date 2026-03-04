import React, { useMemo } from 'react';

import { IMediaArtist } from '../../interfaces';
import { MediaCollectionService } from '../../services';

import { MediaCollectionContextMenuItem } from '../media-collection-context-menu/media-collection-context-menu.component';
import { MediaCollectionGrid } from '../media-collection-grid/media-collection-grid.component';

export function MediaArtists(props: {
  mediaArtists: IMediaArtist[],
}) {
  const { mediaArtists } = props;

  const items = useMemo(() => mediaArtists.map(MediaCollectionService.getMediaItemFromArtist), [
    mediaArtists,
  ]);

  return (
    <MediaCollectionGrid
      items={items}
      contextMenuItems={[
        MediaCollectionContextMenuItem.AddToQueue,
        MediaCollectionContextMenuItem.AddToPlaylist,
      ]}
    />
  );
}

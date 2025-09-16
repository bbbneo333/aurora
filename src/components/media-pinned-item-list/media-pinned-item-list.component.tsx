import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { MediaCollectionService, MediaPinnedItemService } from '../../services';
import { selectSortedPinnedItems } from '../../selectors';

import { InteractiveList } from '../interactive-list/interactive-list.component';
import { MediaCollectionItem } from '../media-collection-item/media-collection-item.component';
import { MediaCollectionContextMenu, MediaCollectionContextMenuItem } from '../media-collection-context-menu/media-collection-context-menu.component';

export function MediaPinnedItemList() {
  const sortedMediaPinnedItems = useSelector(selectSortedPinnedItems);
  const contextMenuId = 'media-pinned-item-list-context-menu';

  useEffect(() => {
    MediaPinnedItemService.loadPinnedItems();
  }, []);

  return (
    <>
      <InteractiveList sortable items={sortedMediaPinnedItems}>
        {pinnedItem => (
          <MediaCollectionItem
            key={pinnedItem.id}
            mediaItem={pinnedItem}
            variant="compact"
            routerLink={MediaCollectionService.getItemRouterLink(pinnedItem)}
            coverPlaceholderIcon={MediaCollectionService.getItemCoverPlaceholderIcon(pinnedItem)}
            subtitle={MediaCollectionService.getItemSubtitle(pinnedItem)}
            contextMenuId={contextMenuId}
          />
        )}
      </InteractiveList>
      <MediaCollectionContextMenu
        id={contextMenuId}
        menuItems={[
          MediaCollectionContextMenuItem.Pin,
          MediaCollectionContextMenuItem.AddToQueue,
          MediaCollectionContextMenuItem.AddToPlaylist,
        ]}
      />
    </>
  );
}

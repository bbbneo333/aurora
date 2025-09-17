import React, { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';
import classNames from 'classnames/bind';

import { MediaCollectionService, MediaPinnedItemService } from '../../services';
import { selectSortedPinnedItems } from '../../selectors';
import { IMediaPinnedItem } from '../../interfaces';

import { InteractiveList } from '../interactive-list/interactive-list.component';
import { MediaCollectionItem } from '../media-collection-item/media-collection-item.component';
import { MediaCollectionContextMenu, MediaCollectionContextMenuItem } from '../media-collection-context-menu/media-collection-context-menu.component';

import styles from './media-pinned-item-list.component.css';

const cx = classNames.bind(styles);

export function MediaPinnedItemList() {
  const sortedMediaPinnedItems = useSelector(selectSortedPinnedItems);
  const contextMenuId = 'media-pinned-item-list-context-menu';

  useEffect(() => {
    MediaPinnedItemService.loadPinnedItems();
  }, []);

  const handleItemsSorted = useCallback(async (items: IMediaPinnedItem[]) => {
    await MediaPinnedItemService.updatePinnedItemsOrder(items.map(item => item.pinned_item_id));
    MediaPinnedItemService.loadPinnedItems();
  }, []);

  return (
    <>
      <InteractiveList
        disableMultiSelect
        sortable
        className={cx('media-pinned-item-list')}
        items={sortedMediaPinnedItems}
        onItemsSorted={handleItemsSorted}
      >
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

import React, { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';
import classNames from 'classnames/bind';
import { isNil } from 'lodash';

import { useModal } from '../../contexts';
import { MediaCollectionItemType } from '../../enums';
import { IMediaPinnedItem } from '../../interfaces';
import { MediaCollectionService, MediaPinnedItemService } from '../../services';
import { selectSortedPinnedItems } from '../../selectors';

import { List } from '../list/list.component';
import { MediaCollectionItem } from '../media-collection-item/media-collection-item.component';
import { MediaCollectionContextMenu, MediaCollectionContextMenuItem } from '../media-collection-context-menu/media-collection-context-menu.component';
import { MediaPlaylistDeleteModal } from '../media-playlist-delete-modal/media-playlist-delete-modal.component';

import styles from './media-pinned-item-list.component.css';

const cx = classNames.bind(styles);

export function MediaPinnedItemList() {
  const sortedMediaPinnedItems = useSelector(selectSortedPinnedItems);
  const { showModal } = useModal();
  const contextMenuId = 'media-pinned-item-list-context-menu';

  useEffect(() => {
    MediaPinnedItemService.loadPinnedItems();
  }, []);

  const handleItemsSorted = useCallback(async (items: IMediaPinnedItem[]) => {
    await MediaPinnedItemService.updatePinnedItemsOrder(items.map(item => item.pinned_item_id));
  }, []);

  const handleItemsDelete = useCallback((ids: string[]) => new Promise<boolean>((resolve) => {
    const pinnedItemId = ids[0];
    const pinnedItem = sortedMediaPinnedItems.find(item => item.pinned_item_id === pinnedItemId);

    if (pinnedItem && pinnedItem.type === MediaCollectionItemType.Playlist) {
      showModal(MediaPlaylistDeleteModal, {
        mediaPlaylistId: pinnedItem.id,
      }, {
        onComplete: (result) => {
          resolve(!isNil(result?.deletedId));
          MediaPinnedItemService.loadPinnedItems(); // TODO: Remove this, items should be automatically removed on collection item removal
        },
      });
    } else {
      resolve(false);
    }
  }), [
    showModal,
    sortedMediaPinnedItems,
  ]);

  return (
    <>
      <List
        disableMultiSelect
        sortable
        className={cx('media-pinned-item-list')}
        items={sortedMediaPinnedItems}
        getItemId={item => item.pinned_item_id}
        onItemsSorted={handleItemsSorted}
        onItemsDelete={handleItemsDelete}
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
      </List>
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

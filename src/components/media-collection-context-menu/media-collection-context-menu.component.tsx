import React, { useCallback } from 'react';

import {
  Menu,
  Separator as MenuSeparator,
  Item,
  Submenu,
  ItemParams,
  animation,
} from 'react-contexify';

import { IMediaCollectionItem } from '../../interfaces';
import { I18nService, MediaLibraryService, MediaPlayerService } from '../../services';

export const MediaCollectionContextMenuId = 'media_collection_context_menu';

export enum MediaCollectionContextMenuItem {
  AddToQueue,
  AddToPlaylist,
  Separator,
}

export enum MediaCollectionContextMenuItemAction {
  AddToQueue = 'media/collection/action/addToQueue',
  AddToPlaylist = 'media/collection/addToPlaylist',
}

export interface MediaCollectionContextMenuItemProps {
  mediaItem: IMediaCollectionItem;
}

export function MediaCollectionContextMenu(props: {
  menuItems: MediaCollectionContextMenuItem[],
}) {
  const {
    menuItems,
  } = props;

  const handleMenuItemClick = useCallback((itemParams: ItemParams<MediaCollectionContextMenuItemProps>) => {
    const itemAction: MediaCollectionContextMenuItemAction = itemParams.event.currentTarget.id as MediaCollectionContextMenuItemAction;
    const mediaItem: IMediaCollectionItem | undefined = itemParams.props?.mediaItem;

    switch (itemAction) {
      case MediaCollectionContextMenuItemAction.AddToQueue: {
        if (!mediaItem) {
          throw new Error('MediaCollectionContextMenu encountered error while performing action AddToQueue - No media item was provided');
        }
        MediaLibraryService
          .getMediaAlbumTracks(mediaItem.id)
          .then((mediaAlbumTracks) => {
            MediaPlayerService.addMediaTracksToQueue(mediaAlbumTracks);
          });
        break;
      }
      default:
      // unsupported action, do nothing
    }
  }, []);

  return (
    <Menu id={MediaCollectionContextMenuId} animation={animation.fade}>
      {menuItems.map((menuItem, menuItemPointer) => {
        switch (menuItem) {
          case MediaCollectionContextMenuItem.AddToQueue:
            return (
              <Item
                key={MediaCollectionContextMenuItem.AddToQueue}
                id={MediaCollectionContextMenuItemAction.AddToQueue}
                onClick={handleMenuItemClick}
              >
                {I18nService.getString('label_submenu_media_collection_add_to_queue')}
              </Item>
            );
          case MediaCollectionContextMenuItem.AddToPlaylist:
            return (
              <Submenu
                disabled
                key={MediaCollectionContextMenuItem.AddToPlaylist}
                label={I18nService.getString('label_submenu_media_collection_add_to_playlist')}
              >
                {/* <Item id={MediaTrackContextMenuItemAction.AddToPlaylist} onClick={handleMenuItemClick}> */}
                {/* </Item> */}
              </Submenu>
            );
          case MediaCollectionContextMenuItem.Separator: {
            return (
              // eslint-disable-next-line react/no-array-index-key
              <MenuSeparator key={`${MediaCollectionContextMenuItem.Separator}-${menuItemPointer}`}/>
            );
          }
          default:
            return (
              <></>
            );
        }
      })}
    </Menu>
  );
}

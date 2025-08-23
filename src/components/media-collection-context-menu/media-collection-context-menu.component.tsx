import React, { useCallback } from 'react';

import {
  Menu,
  Separator as MenuSeparator,
  Item,
  Submenu,
  ItemParams,
} from 'react-contexify';

import { useContextMenu } from '../../contexts';
import { IMediaCollectionItem } from '../../interfaces';
import { I18nService, MediaLibraryService, MediaPlayerService } from '../../services';

import { MediaPlaylistContextMenu } from '../media-playlist-context-menu/media-playlist-context-menu.component';

export enum MediaCollectionContextMenuItem {
  AddToQueue,
  AddToPlaylist,
  Separator,
  ManagePlaylist,
}

export enum MediaCollectionContextMenuItemAction {
  AddToQueue = 'media/collection/action/addToQueue',
}

export interface MediaCollectionContextMenuItemProps {
  mediaItem: IMediaCollectionItem;
}

export function MediaCollectionContextMenu(props: {
  id: string,
  menuItems: MediaCollectionContextMenuItem[],
}) {
  const { id, menuItems } = props;
  const { menuProps } = useContextMenu<MediaCollectionContextMenuItemProps>();

  const handleMenuItemClick = useCallback((itemParams: ItemParams<MediaCollectionContextMenuItemProps>) => {
    const itemAction: MediaCollectionContextMenuItemAction = itemParams.id as MediaCollectionContextMenuItemAction;
    const { mediaItem } = menuProps;

    switch (itemAction) {
      case MediaCollectionContextMenuItemAction.AddToQueue: {
        if (!mediaItem) {
          throw new Error('MediaCollectionContextMenu encountered error while performing action AddToQueue - No media item was provided');
        }
        MediaLibraryService
          .getMediaCollectionTracks(mediaItem)
          .then((mediaTracks) => {
            MediaPlayerService.addMediaTracksToQueue(mediaTracks);
          });
        break;
      }
      default:
      // unsupported action, do nothing
    }
  }, [
    menuProps,
  ]);

  return (
    <Menu id={id}>
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
                key={MediaCollectionContextMenuItem.AddToPlaylist}
                label={I18nService.getString('label_submenu_media_collection_add_to_playlist')}
              >
                <MediaPlaylistContextMenu
                  key={MediaCollectionContextMenuItem.AddToPlaylist}
                  type="add"
                />
              </Submenu>
            );
          case MediaCollectionContextMenuItem.ManagePlaylist:
            return (
              <MediaPlaylistContextMenu
                key={MediaCollectionContextMenuItem.ManagePlaylist}
                type="manage"
              />
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

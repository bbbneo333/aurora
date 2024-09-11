import React, { useCallback } from 'react';

import {
  Menu,
  Separator as MenuSeparator,
  Item,
  Submenu,
  ItemParams,
  animation,
} from 'react-contexify';

import { IMediaAlbum } from '../../interfaces';
import { I18nService, MediaLibraryService, MediaPlayerService } from '../../services';

export enum MediaAlbumContextMenuItem {
  AddToQueue,
  AddToPlaylist,
  Separator,
}

export enum MediaAlbumContextMenuItemAction {
  AddToQueue = 'media/album/action/addToQueue',
  AddToPlaylist = 'media/album/addToPlaylist',
}

export interface MediaAlbumContextMenuItemProps {
  mediaAlbum: IMediaAlbum;
}

export function MediaAlbumContextMenu(props: {
  id: string;
  menuItems: MediaAlbumContextMenuItem[],
}) {
  const {
    id,
    menuItems,
  } = props;

  const handleMenuItemClick = useCallback((itemParams: ItemParams<MediaAlbumContextMenuItemProps>) => {
    const itemAction: MediaAlbumContextMenuItemAction = itemParams.event.currentTarget.id as MediaAlbumContextMenuItemAction;

    const mediaAlbum: IMediaAlbum | undefined = itemParams.props?.mediaAlbum;

    switch (itemAction) {
      case MediaAlbumContextMenuItemAction.AddToQueue: {
        if (!mediaAlbum) {
          throw new Error('MediaAlbumContextMenu encountered error while performing action AddToQueue - No media album was provided');
        }
        MediaLibraryService
          .getMediaAlbumTracks(mediaAlbum.id)
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
    <Menu id={id} animation={animation.fade}>
      {menuItems.map((menuItem, menuItemPointer) => {
        switch (menuItem) {
          case MediaAlbumContextMenuItem.AddToQueue:
            return (
              <Item
                key={MediaAlbumContextMenuItem.AddToQueue}
                id={MediaAlbumContextMenuItemAction.AddToQueue}
                onClick={handleMenuItemClick}
              >
                {I18nService.getString('label_submenu_media_album_add_to_queue')}
              </Item>
            );
          case MediaAlbumContextMenuItem.AddToPlaylist:
            return (
              <Submenu
                disabled
                key={MediaAlbumContextMenuItem.AddToPlaylist}
                label={I18nService.getString('label_submenu_media_album_add_to_playlist')}
              >
                {/* <Item id={MediaTrackContextMenuItemAction.AddToPlaylist} onClick={handleMenuItemClick}> */}
                {/* </Item> */}
              </Submenu>
            );
          case MediaAlbumContextMenuItem.Separator: {
            return (
              // eslint-disable-next-line react/no-array-index-key
              <MenuSeparator key={`${MediaAlbumContextMenuItem.Separator}-${menuItemPointer}`}/>
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

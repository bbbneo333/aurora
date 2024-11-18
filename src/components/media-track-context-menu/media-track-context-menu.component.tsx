import React, { useCallback } from 'react';

import {
  Menu,
  Separator as MenuSeparator,
  Item,
  Submenu,
  ItemParams,
} from 'react-contexify';

import { useContextMenu } from '../../contexts';
import { IMediaQueueTrack, IMediaTrack } from '../../interfaces';
import { I18nService, MediaPlayerService } from '../../services';
import { MediaPlaylistContextMenu } from '../media-playlist-context-menu/media-playlist-context-menu.component';

export enum MediaTrackContextMenuItem {
  AddToQueue,
  AddToPlaylist,
  RemoveFromQueue,
  Separator,
}

export enum MediaTrackContextMenuItemAction {
  AddToQueue = 'media/track/action/addToQueue',
  RemoveFromQueue = 'media/track/action/removeFromQueue',
}

export interface MediaTrackContextMenuItemProps {
  mediaTrack?: IMediaTrack;
  mediaQueueTrack?: IMediaQueueTrack;
}

export function MediaTrackContextMenu(props: {
  id: string;
  menuItems: MediaTrackContextMenuItem[],
}) {
  const { id, menuItems } = props;
  const { menuProps } = useContextMenu<MediaTrackContextMenuItemProps>();

  const handleMenuItemClick = useCallback((itemParams: ItemParams<MediaTrackContextMenuItemProps>) => {
    const itemAction: MediaTrackContextMenuItemAction = itemParams.id as MediaTrackContextMenuItemAction;
    const { mediaTrack, mediaQueueTrack } = menuProps;

    switch (itemAction) {
      case MediaTrackContextMenuItemAction.AddToQueue:
        if (!mediaTrack) {
          throw new Error('MediaTrackContextMenu encountered error while performing action AddToQueue - No media track was provided');
        }
        MediaPlayerService.addMediaTrackToQueue(mediaTrack);
        break;
      case MediaTrackContextMenuItemAction.RemoveFromQueue:
        if (!mediaQueueTrack) {
          throw new Error('MediaTrackContextMenu encountered error while performing action RemoveFromQueue - No media queue track was provided');
        }
        MediaPlayerService.removeMediaTrackFromQueue(mediaQueueTrack);
        break;
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
          case MediaTrackContextMenuItem.AddToQueue:
            return (
              <Item
                key={MediaTrackContextMenuItem.AddToQueue}
                id={MediaTrackContextMenuItemAction.AddToQueue}
                onClick={handleMenuItemClick}
              >
                {I18nService.getString('label_submenu_media_track_add_to_queue')}
              </Item>
            );
          case MediaTrackContextMenuItem.RemoveFromQueue:
            return (
              <Item
                key={MediaTrackContextMenuItem.RemoveFromQueue}
                id={MediaTrackContextMenuItemAction.RemoveFromQueue}
                onClick={handleMenuItemClick}
              >
                {I18nService.getString('label_submenu_media_track_remove_from_queue')}
              </Item>
            );
          case MediaTrackContextMenuItem.AddToPlaylist:
            return (
              <Submenu
                key={MediaTrackContextMenuItem.AddToPlaylist}
                label={I18nService.getString('label_submenu_media_track_add_to_playlist')}
              >
                <MediaPlaylistContextMenu/>
              </Submenu>
            );
          case MediaTrackContextMenuItem.Separator: {
            return (
              // eslint-disable-next-line react/no-array-index-key
              <MenuSeparator key={`${MediaTrackContextMenuItem.Separator}-${menuItemPointer}`}/>
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

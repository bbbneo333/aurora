import React, {useCallback} from 'react';

import {
  Menu,
  Separator as MenuSeparator,
  Item,
  Submenu,
  ItemParams,
  animation,
} from 'react-contexify';

import {IMediaQueueTrack, IMediaTrack} from '../../interfaces';
import {I18nService, MediaPlayerService} from '../../services';

export enum MediaTrackContextMenuItem {
  AddToQueue,
  AddToLikedSongs,
  AddToPlaylist,
  RemoveFromQueue,
  Separator,
}

export enum MediaTrackContextMenuItemAction {
  AddToQueue = 'add_to_queue',
  AddToLikedSongs = 'add_to_liked_songs',
  AddToPlaylist = 'add_to_playlist',
  RemoveFromQueue = 'remove_from_queue',
}

export interface MediaTrackContextMenuItemProps {
  mediaTrack?: IMediaTrack;
  mediaQueueTrack?: IMediaQueueTrack;
}

export function MediaTrackContextMenu(props: {
  id: string;
  menuItems: MediaTrackContextMenuItem[],
}) {
  const {
    id,
    menuItems,
  } = props;

  const handleMenuItemClick = useCallback((itemParams: ItemParams<MediaTrackContextMenuItemProps>) => {
    const itemAction: MediaTrackContextMenuItemAction = itemParams.event.currentTarget.id as MediaTrackContextMenuItemAction;

    const mediaTrack: IMediaTrack|undefined = itemParams.props?.mediaTrack;
    const mediaQueueTrack: IMediaQueueTrack|undefined = itemParams.props?.mediaQueueTrack;

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
  }, []);

  return (
    <Menu id={id} animation={animation.fade}>
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
          case MediaTrackContextMenuItem.AddToLikedSongs:
            return (
              <Item
                disabled
                key={MediaTrackContextMenuItem.AddToLikedSongs}
                id={MediaTrackContextMenuItemAction.AddToLikedSongs}
                onClick={handleMenuItemClick}
              >
                {I18nService.getString('label_submenu_media_track_add_to_liked_songs')}
              </Item>
            );
          case MediaTrackContextMenuItem.AddToPlaylist:
            return (
              <Submenu
                disabled
                key={MediaTrackContextMenuItem.AddToPlaylist}
                label={I18nService.getString('label_submenu_media_track_add_to_playlist')}
              >
                {/* <Item id={MediaTrackContextMenuItemAction.AddToPlaylist} onClick={handleMenuItemClick}> */}
                {/* </Item> */}
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

import React, { useCallback } from 'react';

import {
  Menu,
  Separator as MenuSeparator,
  Item,
  Submenu,
  ItemParams,
} from 'react-contexify';

import { useContextMenu } from '../../contexts';
import { I18nService, MediaLibraryService, MediaPlayerService } from '../../services';

import {
  IMediaPlaylistTrack,
  IMediaQueueTrack,
  IMediaTrack,
  IMediaTrackList,
} from '../../interfaces';

import { MediaPlaylistContextMenu } from '../media-playlist-context-menu/media-playlist-context-menu.component';

export enum MediaTrackContextMenuItem {
  AddToQueue,
  AddToPlaylist,
  RemoveFromQueue,
  RemoveFromPlaylist,
  Separator,
}

export enum MediaTrackContextMenuItemAction {
  AddToQueue = 'media/track/action/addToQueue',
  RemoveFromQueue = 'media/track/action/removeFromQueue',
  RemoveFromPlaylist = 'media/track/action/removeFromPlaylist',
}

export interface MediaTrackContextMenuItemProps {
  mediaTrack?: IMediaTrack;
  mediaTrackList?: IMediaTrackList;
}

export function MediaTrackContextMenu(props: {
  id: string;
  menuItems: MediaTrackContextMenuItem[],
}) {
  const { id, menuItems } = props;
  const { menuProps } = useContextMenu<MediaTrackContextMenuItemProps>();

  const handleMenuItemClick = useCallback(async (itemParams: ItemParams<MediaTrackContextMenuItemProps>) => {
    const itemAction: MediaTrackContextMenuItemAction = itemParams.id as MediaTrackContextMenuItemAction;
    const { mediaTrack, mediaTrackList } = menuProps;

    switch (itemAction) {
      case MediaTrackContextMenuItemAction.AddToQueue: {
        if (!mediaTrack) {
          throw new Error('MediaTrackContextMenu encountered error while performing action AddToQueue - No media track was provided');
        }
        MediaPlayerService.addMediaTrackToQueue(mediaTrack);
        break;
      }
      case MediaTrackContextMenuItemAction.RemoveFromQueue: {
        // manually cast track and perform checks
        const mediaQueueTrack = mediaTrack as IMediaQueueTrack;

        if (!mediaQueueTrack || !mediaQueueTrack.queue_entry_id) {
          throw new Error('MediaTrackContextMenu encountered error while performing action RemoveFromQueue - No or invalid media queue track was provided');
        }
        MediaPlayerService.removeMediaTrackFromQueue(mediaQueueTrack);
        break;
      }
      case MediaTrackContextMenuItemAction.RemoveFromPlaylist: {
        // manually cast track and perform checks
        const mediaPlaylistTrack = mediaTrack as IMediaPlaylistTrack;

        if (!mediaPlaylistTrack || !mediaPlaylistTrack.playlist_track_id) {
          throw new Error('MediaTrackContextMenu encountered error while performing action RemoveFromPlaylist - No or invalid playlist track was provided');
        }
        if (!mediaTrackList) {
          throw new Error('MediaTrackContextMenu encountered error while performing action RemoveFromPlaylist - No media playlist was provided');
        }
        await MediaLibraryService.deleteMediaPlaylistTracks(mediaTrackList.id, [
          mediaPlaylistTrack.playlist_track_id,
        ]);
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
          case MediaTrackContextMenuItem.RemoveFromPlaylist:
            return (
              <Item
                key={MediaTrackContextMenuItem.RemoveFromPlaylist}
                id={MediaTrackContextMenuItemAction.RemoveFromPlaylist}
                onClick={handleMenuItemClick}
              >
                {I18nService.getString('label_submenu_media_track_remove_from_playlist')}
              </Item>
            );
          case MediaTrackContextMenuItem.AddToPlaylist:
            return (
              <Submenu
                key={MediaTrackContextMenuItem.AddToPlaylist}
                label={I18nService.getString('label_submenu_media_track_add_to_playlist')}
              >
                <MediaPlaylistContextMenu type="add"/>
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

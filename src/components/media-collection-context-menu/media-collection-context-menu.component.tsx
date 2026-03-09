import React, { useCallback, useEffect } from 'react';

import {
  Menu,
  Separator as MenuSeparator,
  Item,
  Submenu,
  ItemParams,
} from 'react-contexify';

import { useContextMenu } from '../../contexts';
import { useMediaCollectionPin, useScrollLock } from '../../hooks';
import { IMediaCollectionItem } from '../../interfaces';
import {
  I18nService,
  MediaAlbumService,
  MediaCollectionService,
  MediaPlayerService,
  MediaPlaylistService,
} from '../../services';
import { MediaCollectionItemType } from '../../enums';

import { MediaPlaylistContextMenu } from '../media-playlist-context-menu/media-playlist-context-menu.component';

export enum MediaCollectionContextMenuItem {
  AddToQueue,
  AddToPlaylist,
  Separator,
  ManagePlaylist,
  Pin,
  ToggleHidden,
}

export enum MediaCollectionContextMenuItemAction {
  AddToQueue = 'media/collection/action/addToQueue',
  Pin = 'media/collection/action/pin',
  ToggleHidden = 'media/collection/action/toggleHidden',
}

export interface MediaCollectionContextMenuItemProps {
  mediaItem?: IMediaCollectionItem;
}

export function MediaCollectionContextMenu(props: {
  id: string,
  menuItems: MediaCollectionContextMenuItem[],
}) {
  const { id, menuItems } = props;
  const { menuProps, hideAll } = useContextMenu<MediaCollectionContextMenuItemProps>();
  const { mediaItem } = menuProps || {};
  const { triggerScrollLock } = useScrollLock({
    scrollableSelector: '.app-scrollable',
    blockableSelector: '.contexify.contexify_willEnter-fade',
  });

  const {
    isPinned,
    isPinnedStatusLoading,
    togglePinned,
  } = useMediaCollectionPin({
    mediaItem,
  });

  const handleMenuItemClick = useCallback(async (itemParams: ItemParams<MediaCollectionContextMenuItemProps>) => {
    const itemAction: MediaCollectionContextMenuItemAction = itemParams.id as MediaCollectionContextMenuItemAction;
    hideAll();

    switch (itemAction) {
      case MediaCollectionContextMenuItemAction.AddToQueue: {
        if (!mediaItem) {
          throw new Error('MediaCollectionContextMenu encountered error while performing action AddToQueue - No media item was provided');
        }

        MediaCollectionService
          .getMediaCollectionTracks(mediaItem)
          .then((mediaTracks) => {
            MediaPlayerService.addMediaTracksToQueue(mediaTracks);
          });
        break;
      }
      case MediaCollectionContextMenuItemAction.Pin: {
        if (!mediaItem) {
          throw new Error('MediaCollectionContextMenu encountered error while performing action Pin - No media item was provided');
        }

        await togglePinned();
        break;
      }
      case MediaCollectionContextMenuItemAction.ToggleHidden: {
        if (!mediaItem) {
          throw new Error('MediaCollectionContextMenu encountered error while performing action ToggleHidden - No media item was provided');
        }

        if (mediaItem.type === MediaCollectionItemType.Album) {
          await MediaAlbumService.updateMediaAlbum({
            id: mediaItem.id,
          }, {
            hidden: !mediaItem.hidden,
          });
          MediaAlbumService.loadMediaAlbums();
          MediaPlaylistService.loadMediaPlaylists();
        } else if (mediaItem.type === MediaCollectionItemType.Playlist && mediaItem.hidden) {
          await MediaAlbumService.updateMediaAlbum({
            id: mediaItem.id,
          }, {
            hidden: false,
          });
          MediaAlbumService.loadMediaAlbums();
          MediaPlaylistService.loadMediaPlaylists();
        }
        break;
      }
      default:
      // unsupported action, do nothing
    }
  }, [
    hideAll,
    mediaItem,
    togglePinned,
  ]);

  useEffect(() => () => {
    triggerScrollLock();
  }, [
    triggerScrollLock,
  ]);

  return (
    <Menu id={id} onVisibilityChange={triggerScrollLock}>
      {menuItems.map((menuItem, menuItemPointer) => {
        switch (menuItem) {
          case MediaCollectionContextMenuItem.Pin:
            return (
              <Item
                key={MediaCollectionContextMenuItem.Pin}
                id={MediaCollectionContextMenuItemAction.Pin}
                onClick={handleMenuItemClick}
                disabled={isPinnedStatusLoading}
              >
                {I18nService.getString(isPinned ? 'label_submenu_media_collection_unpin' : 'label_submenu_media_collection_pin', {
                  collectionType: mediaItem ? MediaCollectionService.getItemSubtitle(mediaItem) : '',
                })}
              </Item>
            );
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
          case MediaCollectionContextMenuItem.ToggleHidden:
            if (mediaItem?.type === MediaCollectionItemType.Album) {
              return (
                <Item
                  key={MediaCollectionContextMenuItem.ToggleHidden}
                  id={MediaCollectionContextMenuItemAction.ToggleHidden}
                  onClick={handleMenuItemClick}
                >
                  {I18nService.getString(mediaItem.hidden ? 'label_submenu_media_collection_show' : 'label_submenu_media_collection_hide')}
                </Item>
              );
            }

            if (mediaItem?.type === MediaCollectionItemType.Playlist && mediaItem.hidden) {
              return (
                <Item
                  key={MediaCollectionContextMenuItem.ToggleHidden}
                  id={MediaCollectionContextMenuItemAction.ToggleHidden}
                  onClick={handleMenuItemClick}
                >
                  {I18nService.getString('label_submenu_media_collection_show')}
                </Item>
              );
            }

            return <></>;
          default:
            return (
              <></>
            );
        }
      })}
    </Menu>
  );
}

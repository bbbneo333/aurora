import React, { useCallback, useEffect } from 'react';
import { isEmpty } from 'lodash';

import {
  Menu,
  Separator as MenuSeparator,
  Item,
  Submenu,
  ItemParams,
} from 'react-contexify';

import { useContextMenu } from '../../contexts';
import { useMediaTrackLike, useScrollLock } from '../../hooks';
import { I18nService, MediaPlayerService, MediaPlaylistService } from '../../services';

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
  Like,
  Separator,
}

export enum MediaTrackContextMenuItemAction {
  AddToQueue = 'media/track/action/addToQueue',
  RemoveFromQueue = 'media/track/action/removeFromQueue',
  RemoveFromPlaylist = 'media/track/action/removeFromPlaylist',
  Like = 'media/track/action/likeTrack', // handles both - remove and add
}

export interface MediaTrackContextMenuItemProps {
  mediaTrack?: IMediaTrack;
  mediaTrackList?: IMediaTrackList;
  mediaTracks?: IMediaTrack[];
}

export function MediaTrackContextMenu(props: {
  id: string;
  menuItems: MediaTrackContextMenuItem[],
}) {
  const { id, menuItems } = props;
  const { menuProps, hideAll } = useContextMenu<MediaTrackContextMenuItemProps>();
  const { mediaTrack, mediaTracks, mediaTrackList } = menuProps || {};
  const { triggerScrollLock } = useScrollLock({
    scrollableSelector: '.app-scrollable',
    blockableSelector: '.contexify.contexify_willEnter-fade',
  });

  const {
    isTrackLiked,
    isLikeStatusLoading,
    areAllTracksLiked,
    toggleLike,
  } = useMediaTrackLike({
    mediaTrack,
    mediaTracks,
  });

  const handleMenuItemClick = useCallback(async (itemParams: ItemParams<MediaTrackContextMenuItemProps>) => {
    const itemAction: MediaTrackContextMenuItemAction = itemParams.id as MediaTrackContextMenuItemAction;
    hideAll();

    switch (itemAction) {
      case MediaTrackContextMenuItemAction.AddToQueue: {
        if (mediaTrack) {
          MediaPlayerService.addMediaTrackToQueue(mediaTrack);
        } else if (mediaTracks && !isEmpty(mediaTracks)) {
          MediaPlayerService.addMediaTracksToQueue(mediaTracks);
        } else {
          throw new Error('MediaTrackContextMenu encountered error while performing action AddToQueue - No media track(s) provided');
        }
        break;
      }
      case MediaTrackContextMenuItemAction.RemoveFromQueue: {
        // manually cast track and perform checks
        const mediaQueueTrack = mediaTrack as IMediaQueueTrack;
        const mediaQueueTracks = mediaTracks as IMediaQueueTrack[];

        if (mediaQueueTrack?.queue_entry_id) {
          MediaPlayerService.removeMediaTrackFromQueue(mediaQueueTrack.queue_entry_id);
        } else if (!isEmpty(mediaQueueTracks)) {
          MediaPlayerService.removeMediaTracksFromQueue(mediaQueueTracks.map(track => track.queue_entry_id));
        } else {
          throw new Error('MediaTrackContextMenu encountered error while performing action RemoveFromQueue - No or invalid media queue track(s) provided');
        }
        break;
      }
      case MediaTrackContextMenuItemAction.RemoveFromPlaylist: {
        // manually cast track and perform checks
        const mediaPlaylistTrack = mediaTrack as IMediaPlaylistTrack;
        const mediaPlaylistTracks = mediaTracks as IMediaPlaylistTrack[];

        if (!mediaTrackList) {
          throw new Error('MediaTrackContextMenu encountered error while performing action RemoveFromPlaylist - No media playlist was provided');
        }

        if (mediaPlaylistTrack?.playlist_track_id) {
          await MediaPlaylistService.deleteMediaPlaylistTracks(mediaTrackList.id, [
            mediaPlaylistTrack.playlist_track_id,
          ]);
        } else if (!isEmpty(mediaPlaylistTracks)) {
          await MediaPlaylistService.deleteMediaPlaylistTracks(mediaTrackList.id, mediaPlaylistTracks.map((track) => {
            if (!track.playlist_track_id) {
              throw new Error('MediaTrackContextMenu encountered error while performing action RemoveFromPlaylist - Invalid playlist track provided');
            }

            return track.playlist_track_id;
          }));
        } else {
          throw new Error('MediaTrackContextMenu encountered error while performing action RemoveFromPlaylist - No or invalid playlist track(s) provided');
        }
        break;
      }
      case MediaTrackContextMenuItemAction.Like: {
        await toggleLike();
        break;
      }
      default:
      // unsupported action, do nothing
    }
  }, [
    hideAll,
    mediaTrack,
    mediaTrackList,
    mediaTracks,
    toggleLike,
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
          case MediaTrackContextMenuItem.Like: {
            return (
              <Item
                disabled={isLikeStatusLoading}
                key={MediaTrackContextMenuItem.Like}
                id={MediaTrackContextMenuItemAction.Like}
                onClick={handleMenuItemClick}
              >
                {!isEmpty(mediaTracks) ? (
                  I18nService.getString(areAllTracksLiked
                    ? 'label_submenu_media_track_remove_from_liked_songs'
                    : 'label_submenu_media_track_add_to_liked_songs')
                ) : (
                  I18nService.getString(isTrackLiked
                    ? 'label_submenu_media_track_remove_from_liked_songs'
                    : 'label_submenu_media_track_add_to_liked_songs')
                )}
              </Item>
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

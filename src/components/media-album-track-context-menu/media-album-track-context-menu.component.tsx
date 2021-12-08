import React, {useCallback} from 'react';

import {
  Menu,
  Item,
  Separator,
  Submenu,
  ItemParams,
  animation,
} from 'react-contexify';

import {ContextMenus} from '../../constants';
import {IMediaAlbum, IMediaTrack} from '../../interfaces';
import {I18nService, MediaPlayerService} from '../../services';

export interface ItemProps {
  mediaTrack: IMediaTrack;
}

enum ItemAction {
  AddToQueue = 'add_to_queue',
  AddToLikedSongs = 'add_to_liked_songs',
  AddToPlaylist = 'add_to_playlist',
}

export function MediaAlbumTrackContextMenu(props: {
  mediaAlbum: IMediaAlbum,
}) {
  const {
    mediaAlbum,
  } = props;

  const handleMenuItemClick = useCallback((itemParams: ItemParams<ItemProps>) => {
    const itemAction: ItemAction = itemParams.event.currentTarget.id as ItemAction;
    const mediaTrack: IMediaTrack | undefined = itemParams.props?.mediaTrack;
    if (!mediaTrack) {
      return;
    }

    switch (itemAction) {
      case ItemAction.AddToQueue:
        MediaPlayerService.addMediaTrackToQueue(mediaTrack);
        break;
      default:
      // unsupported action, do nothing
    }
  }, [
    mediaAlbum,
  ]);

  return (
    <Menu id={ContextMenus.MediaTrack} animation={animation.fade}>
      <Item id={ItemAction.AddToQueue} onClick={handleMenuItemClick}>
        {I18nService.getString('label_submenu_media_track_add_to_queue')}
      </Item>
      <Separator/>
      {/* TODO: Add support for adding track to playlists */}
      <Item id={ItemAction.AddToLikedSongs} onClick={handleMenuItemClick} disabled>
        {I18nService.getString('label_submenu_media_track_add_to_liked_songs')}
      </Item>
      <Submenu label={I18nService.getString('label_submenu_media_track_add_to_playlist')} disabled>
        <Item id={ItemAction.AddToPlaylist} onClick={handleMenuItemClick}>
          My Playlist Comes Here
        </Item>
      </Submenu>
    </Menu>
  );
}

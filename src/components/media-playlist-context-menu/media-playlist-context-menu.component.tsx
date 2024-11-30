import React, { useCallback, useEffect, useState } from 'react';
import { Item, ItemParams, Separator as MenuSeparator } from 'react-contexify';
import { useSelector } from 'react-redux';
import { isEmpty } from 'lodash';
import { useHistory } from 'react-router-dom';

import { Icons, Routes } from '../../constants';
import { useContextMenu, useModal } from '../../contexts';
import { IMediaCollectionItem, IMediaTrack } from '../../interfaces';
import { RootState } from '../../reducers';
import { I18nService, MediaLibraryService } from '../../services';
import { StringUtils, useSearch } from '../../utils';

import { Icon } from '../icon/icon.component';
import { TextInput } from '../text-input/text-input.component';
import { MediaPlaylistDeleteModal } from '../media-playlist-delete-modal/media-playlist-delete-modal.component';

export enum MediaPlaylistContextMenuItemAction {
  SearchPlaylist = 'media/playlist/searchPlaylist',
  CreatePlaylist = 'media/playlist/createPlaylist',
  AddToPlaylist = 'media/playlist/addToPlaylist',
  EditPlaylist = 'media/playlist/editPlaylist',
  DeletePlaylist = 'media/playlist/deletePlaylist',
}

export type MediaPlaylistContextMenuItemProps = {
  mediaTrack?: IMediaTrack;
  mediaItem?: IMediaCollectionItem,
};

export type MediaPlaylistContextMenuItemData = {
  mediaPlaylistId: string;
};

export type MediaPlaylistContextMenuProps = {
  type: 'add' | 'manage';
};

export function MediaPlaylistContextMenu(props: MediaPlaylistContextMenuProps) {
  const { type: mediaPlaylistContextMenuType } = props;
  const { mediaPlaylists } = useSelector((state: RootState) => state.mediaLibrary);
  const [mediaPlaylistsSearchStr, setMediaPlaylistsSearchStr] = useState<string>('');
  const history = useHistory();
  const [searchInputFocus, setSearchInputFocus] = useState(false);
  const { menuProps } = useContextMenu<MediaPlaylistContextMenuItemProps>();
  const mediaPlaylistsToShow = useSearch(mediaPlaylists, mediaPlaylistsSearchStr);
  const { showModal } = useModal();

  useEffect(() => {
    MediaLibraryService.loadMediaPlaylists();
  }, []);

  const handleMenuItemClick = useCallback((itemParams: ItemParams<MediaPlaylistContextMenuItemProps, MediaPlaylistContextMenuItemData>) => {
    const itemAction: MediaPlaylistContextMenuItemAction = itemParams.id as MediaPlaylistContextMenuItemAction;
    const mediaPlaylistId = itemParams.data?.mediaPlaylistId;
    const { mediaTrack, mediaItem } = menuProps;

    async function getMediaTracks(): Promise<IMediaTrack[]> {
      if (mediaTrack) {
        return [mediaTrack];
      }
      if (mediaItem) {
        return MediaLibraryService.getMediaCollectionTracks(mediaItem);
      }

      throw new Error('MediaPlaylistContextMenu encountered error at getMediaTracks - Either mediaTrack or mediaItem is required for handling action');
    }

    switch (itemAction) {
      case MediaPlaylistContextMenuItemAction.CreatePlaylist:
        getMediaTracks().then(async (mediaTracks) => {
          const mediaPlaylist = await MediaLibraryService.createMediaPlaylist({
            tracks: mediaTracks,
          });
          const pathToPlaylist = StringUtils.buildRouteFromMappings(Routes.LibraryPlaylist, {
            playlistId: mediaPlaylist.id,
          });

          history.push(pathToPlaylist);
        });
        break;
      case MediaPlaylistContextMenuItemAction.AddToPlaylist:
        if (!mediaPlaylistId) {
          throw new Error('MediaPlaylistContextMenu encountered error at AddToPlaylist - mediaPlaylistId is required');
        }

        getMediaTracks().then(async (mediaTracks) => {
          await MediaLibraryService.addMediaTracksToPlaylist(mediaPlaylistId, mediaTracks);
        });
        break;
      case MediaPlaylistContextMenuItemAction.EditPlaylist:
        if (!mediaItem) {
          throw new Error('MediaPlaylistContextMenu encountered error at EditPlaylist - mediaItem is required');
        }
        // TODO: Add support for editing playlist
        break;
      case MediaPlaylistContextMenuItemAction.DeletePlaylist:
        if (!mediaItem) {
          throw new Error('MediaPlaylistContextMenu encountered error at DeletePlaylist - mediaItem is required');
        }
        showModal(<MediaPlaylistDeleteModal mediaPlaylistId={mediaItem.id}/>);
        break;
      default:
      // unsupported action, do nothing
    }
  }, [
    menuProps,
  ]);

  if (mediaPlaylistContextMenuType === 'add') {
    return (
      <>
        <Item
          key={MediaPlaylistContextMenuItemAction.SearchPlaylist}
          closeOnClick={false}
          className="contexify_item_inline"
          onFocus={() => {
            setSearchInputFocus(true);
          }}
          onBlur={() => {
            setSearchInputFocus(false);
          }}
        >
          <TextInput
            clearable
            focus={searchInputFocus}
            icon={Icons.Search}
            placeholder={I18nService.getString('placeholder_playlist_context_menu_search_input')}
            onInputValue={(value) => {
              setMediaPlaylistsSearchStr(value);
            }}
            onKeyDown={(event) => {
              // pressing space bar closes the context menu for unknown reasons
              // adding this to handle such cases
              if (event.key === ' ') {
                event.stopPropagation();
              }
            }}
          />
        </Item>
        <Item
          key={MediaPlaylistContextMenuItemAction.CreatePlaylist}
          id={MediaPlaylistContextMenuItemAction.CreatePlaylist}
          className="contexify_item_inline"
          onClick={handleMenuItemClick}
        >
          <Icon name={Icons.AddCircle}/>
          {I18nService.getString('button_create_playlist')}
        </Item>
        <MenuSeparator/>
        {isEmpty(mediaPlaylists) && (
          <Item disabled>
            {I18nService.getString('label_playlists_empty')}
          </Item>
        )}
        {mediaPlaylistsToShow.map(mediaPlaylist => (
          <Item
            key={mediaPlaylist.id}
            id={MediaPlaylistContextMenuItemAction.AddToPlaylist}
            onClick={handleMenuItemClick}
            data={{ mediaPlaylistId: mediaPlaylist.id }}
          >
            {mediaPlaylist.name}
          </Item>
        ))}
      </>
    );
  }
  if (mediaPlaylistContextMenuType === 'manage') {
    return (
      <>
        <Item
          key={MediaPlaylistContextMenuItemAction.EditPlaylist}
          id={MediaPlaylistContextMenuItemAction.EditPlaylist}
          onClick={handleMenuItemClick}
        >
          {I18nService.getString('label_playlist_edit')}
        </Item>
        <Item
          key={MediaPlaylistContextMenuItemAction.DeletePlaylist}
          id={MediaPlaylistContextMenuItemAction.DeletePlaylist}
          onClick={handleMenuItemClick}
        >
          {I18nService.getString('label_playlist_delete')}
        </Item>
      </>
    );
  }

  return (
    <></>
  );
}

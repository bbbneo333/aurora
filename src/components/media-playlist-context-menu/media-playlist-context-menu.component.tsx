import React, { useCallback, useEffect, useState } from 'react';
import { Item, ItemParams, Separator as MenuSeparator } from 'react-contexify';
import { useSelector } from 'react-redux';
import { isEmpty } from 'lodash';
import { useHistory } from 'react-router-dom';

import { Icons, Routes } from '../../constants';
import { useContextMenu, useModal } from '../../contexts';
import { IMediaCollectionItem, IMediaTrack } from '../../interfaces';
import { RootState } from '../../reducers';
import { Events, StringUtils, useSearch } from '../../utils';
import { I18nService, MediaCollectionService, MediaPlaylistService } from '../../services';
import { MediaLibraryPlaylistDuplicateTracksError } from '../../services/media-playlist.service';

import { Icon } from '../icon/icon.component';
import { TextInput } from '../text-input/text-input.component';
import { MediaPlaylistDeleteModal } from '../media-playlist-delete-modal/media-playlist-delete-modal.component';
import { MediaPlaylistEditModal } from '../media-playlist-edit-modal/media-playlist-edit-modal.component';
import { MediaPlaylistDuplicateTrackModal } from '../media-playlist-duplicate-track-modal/media-playlist-duplicate-track-modal.component';

export enum MediaPlaylistContextMenuItemAction {
  SearchPlaylist = 'media/playlist/searchPlaylist',
  CreatePlaylist = 'media/playlist/createPlaylist',
  AddToPlaylist = 'media/playlist/addToPlaylist',
  EditPlaylist = 'media/playlist/editPlaylist',
  DeletePlaylist = 'media/playlist/deletePlaylist',
}

export type MediaPlaylistContextMenuItemProps = {
  mediaTrack?: IMediaTrack;
  mediaTracks?: IMediaTrack[];
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
  const mediaPlaylists = useSelector((state: RootState) => state.mediaLibrary.mediaPlaylists);
  const [mediaPlaylistsSearchStr, setMediaPlaylistsSearchStr] = useState<string>('');
  const history = useHistory();
  const [searchInputFocus, setSearchInputFocus] = useState(false);
  const { menuProps, hideAll } = useContextMenu<MediaPlaylistContextMenuItemProps>();
  const mediaPlaylistsToShow = useSearch(mediaPlaylists, mediaPlaylistsSearchStr);
  const { showModal } = useModal();

  useEffect(() => {
    MediaPlaylistService.loadMediaPlaylists();
  }, []);

  const handleMenuItemClick = useCallback((itemParams: ItemParams<MediaPlaylistContextMenuItemProps, MediaPlaylistContextMenuItemData>) => {
    const itemAction: MediaPlaylistContextMenuItemAction = itemParams.id as MediaPlaylistContextMenuItemAction;
    const mediaPlaylistId = itemParams.data?.mediaPlaylistId;
    const { mediaTrack, mediaTracks, mediaItem } = menuProps;
    hideAll();

    async function getMediaTracks(): Promise<IMediaTrack[]> {
      if (mediaTrack) {
        return [mediaTrack];
      }
      if (mediaTracks && !isEmpty(mediaTracks)) {
        return mediaTracks;
      }
      if (mediaItem) {
        return MediaCollectionService.getMediaCollectionTracks(mediaItem);
      }

      throw new Error('MediaPlaylistContextMenu encountered error at getMediaTracks - Either mediaTrack or mediaItem is required for handling action');
    }

    switch (itemAction) {
      case MediaPlaylistContextMenuItemAction.CreatePlaylist:
        getMediaTracks().then(async (mediaTracksToAdd) => {
          const mediaPlaylist = await MediaPlaylistService.createMediaPlaylist({
            tracks: mediaTracksToAdd,
          });
          const pathToPlaylist = StringUtils.buildRoute(Routes.LibraryPlaylist, {
            playlistId: mediaPlaylist.id,
          });

          history.push(pathToPlaylist);
        });
        break;
      case MediaPlaylistContextMenuItemAction.AddToPlaylist:
        if (!mediaPlaylistId) {
          throw new Error('MediaPlaylistContextMenu encountered error at AddToPlaylist - mediaPlaylistId is required');
        }

        getMediaTracks().then(async (mediaTracksToAdd) => {
          try {
            await MediaPlaylistService.addMediaPlaylistTracks(mediaPlaylistId, mediaTracksToAdd);
          } catch (error) {
            if (error instanceof MediaLibraryPlaylistDuplicateTracksError) {
              // in case of duplicate track, explicitly ask user what to do
              showModal(MediaPlaylistDuplicateTrackModal, {
                mediaPlaylistId,
                inputDataList: mediaTracksToAdd,
                existingTrackDataList: error.existingTrackDataList,
                newTrackDataList: error.newTrackDataList,
              });
            } else {
              throw error;
            }
          }
        });
        break;
      case MediaPlaylistContextMenuItemAction.EditPlaylist:
        if (!mediaItem) {
          throw new Error('MediaPlaylistContextMenu encountered error at EditPlaylist - mediaItem is required');
        }
        showModal(MediaPlaylistEditModal, {
          mediaPlaylistId: mediaItem.id,
        });
        break;
      case MediaPlaylistContextMenuItemAction.DeletePlaylist:
        if (!mediaItem) {
          throw new Error('MediaPlaylistContextMenu encountered error at DeletePlaylist - mediaItem is required');
        }
        showModal(MediaPlaylistDeleteModal, {
          mediaPlaylistId: mediaItem.id,
        });
        break;
      default:
      // unsupported action, do nothing
    }
  }, [
    hideAll,
    history,
    menuProps,
    showModal,
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
            focus={searchInputFocus}
            placeholder={I18nService.getString('placeholder_playlist_context_menu_search_input')}
            onInputValue={(value) => {
              setMediaPlaylistsSearchStr(value);
            }}
            onKeyDown={(event) => {
              // pressing space bar closes the context menu for unknown reasons
              // adding this to handle such cases
              if (Events.isSpaceKey(event)) {
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

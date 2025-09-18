import React from 'react';
import { Menu } from 'react-contexify';
import classNames from 'classnames/bind';

import { useContextMenu, useModal } from '../../contexts';
import { useMediaCollectionPin, useMediaCollectionPlayback } from '../../hooks';
import { Icons } from '../../constants';
import { IMediaCollectionItem } from '../../interfaces';
import { MediaCollectionItemType } from '../../enums';

import {
  I18nService,
  MediaCollectionService,
  MediaPlayerService,
} from '../../services';

import { MediaPlaylistContextMenu } from '../media-playlist-context-menu/media-playlist-context-menu.component';
import { MediaPlaybackButton } from '../media-playback-button/media-playback-button.component';
import { Button } from '../button/button.component';
import { Icon } from '../icon/icon.component';
import { MediaPlaylistEditModal } from '../media-playlist-edit-modal/media-playlist-edit-modal.component';
import { MediaPlaylistDeleteModal } from '../media-playlist-delete-modal/media-playlist-delete-modal.component';

import styles from './media-collection-actions.component.css';

const cx = classNames.bind(styles);

export function MediaCollectionActions(props: {
  mediaItem: IMediaCollectionItem;
  hasTracks?: boolean;
}) {
  const { mediaItem, hasTracks = true } = props;
  const { showMenu } = useContextMenu();
  const { showModal } = useModal();

  const mediaContextMenuId = 'media_collection_context_menu';
  const allowAddToPlaylist = [MediaCollectionItemType.Artist, MediaCollectionItemType.Album].includes(mediaItem.type);
  const isPlaylist = mediaItem.type === MediaCollectionItemType.Playlist;

  const {
    isMediaPlaying,
    play,
    pause,
  } = useMediaCollectionPlayback({
    mediaItem,
  });

  const {
    isPinned,
    togglePinned,
    isPinnedStatusLoading,
  } = useMediaCollectionPin({
    mediaItem,
  });

  return (
    <div className={cx('media-collection-actions')}>
      <MediaPlaybackButton
        isPlaying={isMediaPlaying}
        onPlay={play}
        onPause={pause}
        variant={['rounded', 'primary', 'lg']}
        tooltip={I18nService.getString(!isMediaPlaying ? 'tooltip_play_collection' : 'tooltip_pause_collection')}
        disabled={!hasTracks}
      />
      <Button
        variant={['rounded', 'outline']}
        tooltip={I18nService.getString('tooltip_add_collection_to_queue')}
        onButtonSubmit={() => {
          MediaCollectionService
            .getMediaCollectionTracks(mediaItem)
            .then((mediaTracks) => {
              MediaPlayerService.addMediaTracksToQueue(mediaTracks);
            });
        }}
        disabled={!hasTracks}
      >
        <Icon name={Icons.PlayerQueue}/>
      </Button>
      {allowAddToPlaylist && (
        <>
          <Button
            variant={['rounded', 'outline']}
            tooltip={I18nService.getString('tooltip_add_collection_to_playlist')}
            onButtonSubmit={(e) => {
              showMenu({
                id: mediaContextMenuId,
                event: e,
                props: { mediaItem },
              });
            }}
            disabled={!hasTracks}
          >
            <Icon name={Icons.Add}/>
          </Button>
          <Menu id={mediaContextMenuId}>
            <MediaPlaylistContextMenu type="add"/>
          </Menu>
        </>
      )}
      {isPlaylist && (
        <>
          <Button
            variant={['rounded', 'outline']}
            tooltip={I18nService.getString('tooltip_rename_playlist')}
            onButtonSubmit={() => {
              showModal(MediaPlaylistEditModal, {
                mediaPlaylistId: mediaItem.id,
              });
            }}
          >
            <Icon name={Icons.Edit}/>
          </Button>
          <Button
            variant={['rounded', 'outline']}
            tooltip={I18nService.getString('tooltip_delete_playlist')}
            onButtonSubmit={() => {
              showModal(MediaPlaylistDeleteModal, {
                mediaPlaylistId: mediaItem.id,
              });
            }}
          >
            <Icon name={Icons.Delete}/>
          </Button>
        </>
      )}
      <Button
        className={cx('media-collection-pin-button', { active: isPinned })}
        variant={['rounded', 'outline']}
        tooltip={I18nService.getString(isPinned ? 'tooltip_unpin_collection' : 'tooltip_pin_collection', {
          collectionType: MediaCollectionService.getItemSubtitle(mediaItem),
        })}
        onButtonSubmit={togglePinned}
        disabled={isPinnedStatusLoading}
      >
        <Icon name={Icons.MediaPin}/>
      </Button>
    </div>
  );
}

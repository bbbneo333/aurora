import React from 'react';
import classNames from 'classnames/bind';

import { useModal } from '../../contexts';
import { Icons } from '../../constants';
import { useMediaPlayback } from '../../hooks';
import { IMediaPlaylist } from '../../interfaces';
import { MediaUtils } from '../../utils';
import { I18nService, MediaLibraryService, MediaPlayerService } from '../../services';

import {
  Button,
  Icon,
  MediaPlaybackButton,
  MediaPlaylistDeleteModal,
  MediaPlaylistEditModal,
} from '../../components';

import styles from './playlist.component.css';

const cx = classNames.bind(styles);

export function PlaylistActions(props: {
  mediaPlaylist: IMediaPlaylist;
}) {
  const { mediaPlaylist } = props;
  const mediaItem = MediaUtils.getMediaItemFromPlaylist(mediaPlaylist);
  const { showModal } = useModal();

  const {
    isMediaPlaying,
    handleOnPlayButtonClick,
    handleOnPauseButtonClick,
  } = useMediaPlayback({
    mediaItem,
  });

  return (
    <div className={cx('media-playlist-actions')}>
      <MediaPlaybackButton
        isPlaying={isMediaPlaying}
        onPlay={handleOnPlayButtonClick}
        onPause={handleOnPauseButtonClick}
        variant={['rounded', 'primary', 'lg']}
        tooltip={I18nService.getString(!isMediaPlaying ? 'tooltip_play_collection' : 'tooltip_pause_collection')}
      />
      <Button
        variant={['rounded', 'outline']}
        tooltip={I18nService.getString('tooltip_add_collection_to_queue')}
        onButtonSubmit={() => {
          MediaLibraryService
            .getMediaCollectionTracks(mediaItem)
            .then((mediaTracks) => {
              MediaPlayerService.addMediaTracksToQueue(mediaTracks);
            });
        }}
      >
        <Icon name={Icons.PlayerQueue}/>
      </Button>
      <Button
        variant={['rounded', 'outline']}
        tooltip={I18nService.getString('tooltip_rename_playlist')}
        onButtonSubmit={() => {
          showModal(MediaPlaylistEditModal, {
            mediaPlaylistId: mediaPlaylist.id,
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
    </div>
  );
}

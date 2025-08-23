import React from 'react';
import { Menu } from 'react-contexify';
import classNames from 'classnames/bind';

import { useContextMenu } from '../../contexts';
import { useMediaPlayback } from '../../hooks';
import { I18nService, MediaLibraryService, MediaPlayerService } from '../../services';
import { Icons } from '../../constants';
import { IMediaCollectionItem } from '../../interfaces';

import { MediaPlaylistContextMenu } from '../media-playlist-context-menu/media-playlist-context-menu.component';
import { MediaPlaybackButton } from '../media-playback-button/media-playback-button.component';
import { Button } from '../button/button.component';
import { Icon } from '../icon/icon.component';

import styles from './media-collection-actions.component.css';

const cx = classNames.bind(styles);

export function MediaCollectionActions(props: {
  mediaItem: IMediaCollectionItem;
}) {
  const { mediaItem } = props;
  const { showMenu } = useContextMenu();
  const mediaContextMenuId = 'media_collection_context_menu';

  const {
    isMediaPlaying,
    handleOnPlayButtonClick,
    handleOnPauseButtonClick,
  } = useMediaPlayback({
    mediaItem,
  });

  return (
    <div className={cx('media-collection-actions')}>
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
        tooltip={I18nService.getString('tooltip_add_collection_to_playlist')}
        onButtonSubmit={(e) => {
          showMenu({
            id: mediaContextMenuId,
            event: e,
            props: { mediaItem },
          });
        }}
      >
        <Icon name={Icons.Add}/>
      </Button>
      <Menu id={mediaContextMenuId}>
        <MediaPlaylistContextMenu type="add"/>
      </Menu>
    </div>
  );
}

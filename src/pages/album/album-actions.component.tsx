import React from 'react';
import { Menu } from 'react-contexify';

import { MediaUtils } from '../../utils';
import { useMediaPlayback } from '../../hooks';
import { I18nService, MediaLibraryService, MediaPlayerService } from '../../services';
import { Icons } from '../../constants';
import { useContextMenu } from '../../contexts';
import { IMediaAlbum } from '../../interfaces';

import {
  Button,
  Icon,
  MediaPlaybackButton,
  MediaPlaylistContextMenu,
} from '../../components';

export function AlbumActions(props: {
  mediaAlbum: IMediaAlbum;
}) {
  const { mediaAlbum } = props;
  const mediaItem = MediaUtils.getMediaItemFromAlbum(mediaAlbum);
  const { showMenu } = useContextMenu();
  const mediaContextMenuId = 'media_album_context_menu';

  const {
    isMediaPlaying,
    handleOnPlayButtonClick,
    handleOnPauseButtonClick,
  } = useMediaPlayback({
    mediaItem,
  });

  return (
    <>
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
    </>
  );
}

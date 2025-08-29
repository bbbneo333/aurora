import React, { useCallback } from 'react';
import { Col, Row } from 'react-bootstrap';
import classNames from 'classnames/bind';
import { useSelector } from 'react-redux';

import { Icons } from '../../constants';
import { useContextMenu } from '../../contexts';
import { RootState } from '../../reducers';

import { Icon } from '../icon/icon.component';
import { MediaCoverPicture } from '../media-cover-picture/media-cover-picture.component';
import { MediaTrackInfoComponent } from '../media-track-info/media-track-info.component';

import styles from './media-player-ribbon.component.css';
import { MediaTrackContextMenu, MediaTrackContextMenuItem } from '../media-track-context-menu/media-track-context-menu.component';

const cx = classNames.bind(styles);

export function MediaPlayerInfo() {
  const { showMenu } = useContextMenu();
  const { mediaPlaybackCurrentMediaTrack } = useSelector((state: RootState) => state.mediaPlayer);
  const mediaTrackContextMenuId = 'media_player_playing_track_context_menu';

  const onMediaTrackInfoContextMenu = useCallback((e: React.MouseEvent) => {
    if (!mediaPlaybackCurrentMediaTrack) {
      return;
    }

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();

    showMenu({
      id: mediaTrackContextMenuId,
      event: e,
      props: {
        mediaTrack: mediaPlaybackCurrentMediaTrack,
      },
      position: {
        x: rect.left,
        y: rect.top - 100, // TODO: Hack to place menu just above element
      },
    });
  }, [
    showMenu,
    mediaPlaybackCurrentMediaTrack,
  ]);

  if (!mediaPlaybackCurrentMediaTrack) {
    return (<></>);
  }

  return (
    <Row className={cx('media-player-info-container')}>
      <Col className={cx('col-12', 'media-player-info-column')}>
        <MediaCoverPicture
          mediaPicture={mediaPlaybackCurrentMediaTrack.track_album.album_cover_picture}
          mediaPictureAltText={mediaPlaybackCurrentMediaTrack.track_album.album_name}
          className={cx('media-player-track-cover-image')}
          onContextMenu={onMediaTrackInfoContextMenu}
        />
        <MediaTrackInfoComponent
          mediaTrack={mediaPlaybackCurrentMediaTrack}
          className={cx('media-player-track-info-container')}
          onContextMenu={onMediaTrackInfoContextMenu}
        />
        <div className={cx('media-player-control', 'media-player-control-sm')}>
          <Icon name={Icons.MediaLike}/>
        </div>
        <MediaTrackContextMenu
          id={mediaTrackContextMenuId}
          menuItems={[
            MediaTrackContextMenuItem.AddToQueue,
            MediaTrackContextMenuItem.Separator,
            MediaTrackContextMenuItem.AddToPlaylist,
          ]}
        />
      </Col>
    </Row>
  );
}

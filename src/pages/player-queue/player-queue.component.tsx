import React, { useCallback, useEffect, useState } from 'react';
import classNames from 'classnames/bind';
import { useSelector } from 'react-redux';
import { isEmpty } from 'lodash';

import {
  Button,
  MediaTrack,
  MediaTrackList,
  MediaTrackContextMenu,
  MediaTrackContextMenuItem,
} from '../../components';

import { useContextMenu } from '../../contexts';
import { MediaEnums } from '../../enums';
import { IMediaQueueTrack } from '../../interfaces';
import { RootState } from '../../reducers';
import { I18nService, MediaPlayerService } from '../../services';

import styles from './player-queue.component.css';

const cx = classNames.bind(styles);

export function PlayerQueueComponent() {
  const {
    mediaTracks,
    mediaPlaybackState,
    mediaPlaybackCurrentMediaTrack,
    mediaPlaybackQueueOnShuffle,
  } = useSelector((state: RootState) => state.mediaPlayer);

  const { showMenu } = useContextMenu();
  const mediaTrackContextMenuId = 'media_queue_playing_track_context_menu';
  const [mediaQueueTracks, setMediaQueueTracks] = useState<IMediaQueueTrack[]>([]);

  const onMediaTracksSorted = useCallback((mediaQueueTracksUpdated: IMediaQueueTrack[]) => {
    setMediaQueueTracks(mediaQueueTracksUpdated);
    MediaPlayerService.updateMediaQueueTracks(mediaQueueTracksUpdated);
  }, []);

  useEffect(() => {
    const mediaQueueTracksUpdated = MediaPlayerService.getMediaQueueTracks();
    setMediaQueueTracks(mediaQueueTracksUpdated);
  }, [
    mediaTracks.length,
    mediaPlaybackCurrentMediaTrack?.queue_entry_id,
    mediaPlaybackQueueOnShuffle,
  ]);

  return (
    <div className="container-fluid">
      {!mediaPlaybackCurrentMediaTrack && isEmpty(mediaTracks) && (
        <div className={cx('player-queue-section')}>
          <div className="row">
            <div className="col-12">
              <div className={cx('player-queue-section-header', 'player-queue-empty')}>
                {I18nService.getString('label_player_queue_empty')}
              </div>
            </div>
          </div>
        </div>
      )}
      {mediaPlaybackCurrentMediaTrack && (
        <div className={cx('player-queue-section')}>
          <div className="row">
            <div className="col-12">
              <div className={cx('player-queue-section-header')}>
                {I18nService.getString('label_player_queue_current_track')}
              </div>
              <div className={cx('player-queue-section-content')}>
                <MediaTrack
                  isActive
                  mediaTrack={mediaPlaybackCurrentMediaTrack}
                  isPlaying={mediaPlaybackState === MediaEnums.MediaPlaybackState.Playing}
                  onMediaTrackPlay={() => MediaPlayerService.playMediaTrackFromQueue(mediaPlaybackCurrentMediaTrack)}
                  onContextMenu={(e) => {
                    showMenu({
                      id: mediaTrackContextMenuId,
                      event: e,
                      props: {
                        mediaTrack: mediaPlaybackCurrentMediaTrack,
                      },
                    });
                  }}
                />
                <MediaTrackContextMenu
                  id={mediaTrackContextMenuId}
                  menuItems={[
                    MediaTrackContextMenuItem.AddToQueue,
                    MediaTrackContextMenuItem.Separator,
                    MediaTrackContextMenuItem.AddToPlaylist,
                  ]}
                />
              </div>
            </div>
          </div>
        </div>
      )}
      {!isEmpty(mediaQueueTracks) && (
        <div className={cx('player-queue-section')}>
          <div className="row">
            <div className="col-12">
              <div className={cx('player-queue-section-header')}>
                {I18nService.getString('label_player_queue_upcoming_tracks')}
                <Button
                  className={cx('player-queue-clear-button')}
                  onButtonSubmit={() => {
                    MediaPlayerService.clearMediaQueueTracks();
                  }}
                >
                  {I18nService.getString('button_queue_clear')}
                </Button>
              </div>
              <div className={cx('player-queue-section-content')}>
                <MediaTrackList
                  sortable
                  mediaTracks={mediaQueueTracks}
                  getMediaTrackId={(mediaTrack: IMediaQueueTrack) => mediaTrack.queue_entry_id}
                  contextMenuItems={[
                    MediaTrackContextMenuItem.AddToQueue,
                    MediaTrackContextMenuItem.RemoveFromQueue,
                    MediaTrackContextMenuItem.Separator,
                    MediaTrackContextMenuItem.AddToPlaylist,
                  ]}
                  onMediaTrackPlay={(mediaTrack) => {
                    MediaPlayerService.playMediaTrackFromQueue(mediaTrack);
                  }}
                  onMediaTracksSorted={onMediaTracksSorted}
                  onSelectionDelete={(mediaTrackQueueIds) => {
                    MediaPlayerService.removeMediaTracksFromQueue(mediaTrackQueueIds);
                    return true;
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useEffect } from 'react';
import classNames from 'classnames/bind';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ReactDOM from 'react-dom';
import _, { isEmpty } from 'lodash';

import {
  MediaCoverPicture,
  MediaArtistLink,
  MediaTrackList,
  MediaTrackContextMenuItem,
  MediaCollectionActions,
  MediaAlbumEditModal,
  TextClamp,
  Button,
  Icon,
} from '../../components';

import { useModal } from '../../contexts';
import {
  I18nService,
  MediaAlbumService,
  MediaCollectionService,
  MediaPlayerService,
  MediaTrackService,
} from '../../services';

import { Icons } from '../../constants';
import { RootState } from '../../reducers';
import { MediaEnums } from '../../enums';
import { IMediaTrack } from '../../interfaces';
import { MediaTrackDatastore } from '../../datastores';

import styles from './album.component.css';

const cx = classNames.bind(styles);

type AlbumShuffleMode = 'off' | 'album' | 'all';
const AlbumShuffleModeStorageKey = 'aurora:album-shuffle-mode';

function getNextShuffleMode(shuffleMode: AlbumShuffleMode): AlbumShuffleMode {
  if (shuffleMode === 'off') {
    return 'album';
  }
  if (shuffleMode === 'album') {
    return 'all';
  }
  return 'off';
}

function getShuffleTooltip(shuffleMode: AlbumShuffleMode): string {
  if (shuffleMode === 'album') {
    return 'Shuffle: Album';
  }
  if (shuffleMode === 'all') {
    return 'Shuffle: Alles';
  }
  return 'Shuffle: Aus';
}

function getShuffleIndicator(shuffleMode: AlbumShuffleMode): string {
  if (shuffleMode === 'off') {
    return '0';
  }
  if (shuffleMode === 'album') {
    return 'A';
  }
  return '*';
}

function shuffleTracksAcrossAlbums(mediaTracks: IMediaTrack[]): IMediaTrack[] {
  const mediaTracksByAlbumId = _.mapValues(_.groupBy(mediaTracks, mediaTrack => mediaTrack.track_album.id), albumTracks => _.shuffle(albumTracks));
  const albumIds = Object.keys(mediaTracksByAlbumId);
  const shuffledTracks: IMediaTrack[] = [];
  let previousAlbumId = '';

  while (shuffledTracks.length < mediaTracks.length) {
    const albumIdsWithTracks = albumIds.filter(albumId => (mediaTracksByAlbumId[albumId] || []).length > 0);
    if (albumIdsWithTracks.length === 0) {
      break;
    }

    let candidateAlbumIds = _.without(albumIdsWithTracks, previousAlbumId);
    if (candidateAlbumIds.length === 0) {
      candidateAlbumIds = albumIdsWithTracks;
    }

    const candidateAlbumIdsSorted = _.orderBy(
      candidateAlbumIds,
      albumId => (mediaTracksByAlbumId[albumId] || []).length,
      'desc',
    );
    const topCount = (mediaTracksByAlbumId[candidateAlbumIdsSorted[0]] || []).length;
    const topCandidates = candidateAlbumIdsSorted.filter(albumId => (mediaTracksByAlbumId[albumId] || []).length === topCount);
    const selectedAlbumId = topCandidates[Math.floor(Math.random() * topCandidates.length)];
    const selectedTrack = mediaTracksByAlbumId[selectedAlbumId]?.shift();
    if (!selectedTrack) {
      break;
    }

    shuffledTracks.push(selectedTrack);
    previousAlbumId = selectedAlbumId;
  }

  return shuffledTracks;
}

function AlbumHeaderPlaybackControls(props: {
  albumId: string;
  mediaSelectedAlbumTracks: IMediaTrack[];
}) {
  const { albumId, mediaSelectedAlbumTracks } = props;
  const [isApplyingShuffle, setIsApplyingShuffle] = React.useState(false);
  const [shuffleMode, setShuffleMode] = React.useState<AlbumShuffleMode>(() => {
    const stored = localStorage.getItem(AlbumShuffleModeStorageKey);
    if (stored === 'album' || stored === 'all') {
      return stored;
    }
    return 'off';
  });
  const mediaPlaybackQueueRepeatType = useSelector((state: RootState) => state.mediaPlayer.mediaPlaybackQueueRepeatType);
  const mediaPlaybackCurrentTrackList = useSelector((state: RootState) => state.mediaPlayer.mediaPlaybackCurrentTrackList);
  const isCurrentAlbumQueue = mediaPlaybackCurrentTrackList?.id === albumId;
  const controlsContainer = document.getElementById('browser-header-context-actions');
  let repeatTooltip = 'Wiederholen: Aus';
  if (mediaPlaybackQueueRepeatType === MediaEnums.MediaPlaybackRepeatType.Track) {
    repeatTooltip = 'Wiederholen: Titel';
  } else if (mediaPlaybackQueueRepeatType === MediaEnums.MediaPlaybackRepeatType.Queue && isCurrentAlbumQueue) {
    repeatTooltip = 'Wiederholen: Album';
  }

  useEffect(() => {
    localStorage.setItem(AlbumShuffleModeStorageKey, shuffleMode);
  }, [shuffleMode]);

  if (!controlsContainer) {
    return null;
  }

  return ReactDOM.createPortal(
    <div className={cx('album-header-topbar-actions')}>
      <Button
        className={cx('album-header-topbar-button', {
          active: mediaPlaybackQueueRepeatType === MediaEnums.MediaPlaybackRepeatType.Track
            || (mediaPlaybackQueueRepeatType === MediaEnums.MediaPlaybackRepeatType.Queue && isCurrentAlbumQueue),
        })}
        variant={['rounded', 'outline']}
        tooltip={repeatTooltip}
        onButtonSubmit={() => {
          if (mediaPlaybackQueueRepeatType === MediaEnums.MediaPlaybackRepeatType.Track) {
            MediaPlayerService.setRepeat(MediaEnums.MediaPlaybackRepeatType.Queue);
            return;
          }

          if (mediaPlaybackQueueRepeatType === MediaEnums.MediaPlaybackRepeatType.Queue && isCurrentAlbumQueue) {
            MediaPlayerService.setRepeat(undefined);
            return;
          }

          MediaPlayerService.setRepeat(MediaEnums.MediaPlaybackRepeatType.Track);
        }}
      >
        <Icon name={Icons.PlayerRepeat}/>
        <span className={cx('album-header-repeat-indicator', {
          active: mediaPlaybackQueueRepeatType === MediaEnums.MediaPlaybackRepeatType.Track,
        })}
        >
          1
        </span>
      </Button>
      <Button
        className={cx('album-header-topbar-button', {
          active: shuffleMode !== 'off',
        })}
        variant={['rounded', 'outline']}
        tooltip={getShuffleTooltip(shuffleMode)}
        disabled={isApplyingShuffle}
        onButtonSubmit={async () => {
          const nextMode = getNextShuffleMode(shuffleMode);
          setShuffleMode(nextMode);

          if (nextMode === 'off') {
            MediaPlayerService.setShuffle(false);
            return;
          }

          setIsApplyingShuffle(true);
          try {
            if (nextMode === 'album') {
              if (isEmpty(mediaSelectedAlbumTracks)) {
                return;
              }
              const shuffledAlbumTracks = _.shuffle(mediaSelectedAlbumTracks);
              MediaPlayerService.setShuffle(false);
              MediaPlayerService.playMediaTrackFromList(shuffledAlbumTracks, 0, {
                id: albumId,
              });
              return;
            }

            const mediaTrackDataList = await MediaTrackDatastore.findMediaTracks();
            const mediaTracks = await MediaTrackService.buildMediaTracks(mediaTrackDataList);
            if (isEmpty(mediaTracks)) {
              return;
            }

            const shuffledTracks = shuffleTracksAcrossAlbums(mediaTracks);
            MediaPlayerService.setShuffle(false);
            MediaPlayerService.playMediaTrackFromList(shuffledTracks, 0, {
              id: 'shuffle-all-albums',
            });
          } finally {
            setIsApplyingShuffle(false);
          }
        }}
      >
        <Icon name={Icons.PlayerShuffle}/>
        <span className={cx('album-header-shuffle-indicator')}>
          {getShuffleIndicator(shuffleMode)}
        </span>
      </Button>
    </div>,
    controlsContainer,
  );
}

export function AlbumPage() {
  const { albumId } = useParams() as { albumId: string };
  const { showModal } = useModal();
  const mediaSelectedAlbum = useSelector((state: RootState) => state.mediaLibrary.mediaSelectedAlbum);
  const mediaSelectedAlbumTracks = useSelector((state: RootState) => state.mediaLibrary.mediaSelectedAlbumTracks);

  useEffect(() => {
    MediaTrackService.loadMediaAlbumTracks(albumId);

    return () => MediaAlbumService.unloadMediaAlbum();
  }, [
    albumId,
  ]);

  if (!mediaSelectedAlbum || !mediaSelectedAlbumTracks) {
    return (<></>);
  }

  return (
    <div className="container-fluid">
      <AlbumHeaderPlaybackControls albumId={albumId} mediaSelectedAlbumTracks={mediaSelectedAlbumTracks}/>
      <div className={cx('album-header')}>
        <div className="row">
          <div className={cx('col-auto', 'album-header-cover-column')}>
            <MediaCoverPicture
              mediaPicture={mediaSelectedAlbum.album_cover_picture}
              mediaPictureAltText={mediaSelectedAlbum.album_name}
              mediaCoverPlaceholderIcon={Icons.AlbumPlaceholder}
              className={cx('album-cover-picture')}
            />
          </div>
          <div className={cx('col', 'album-header-info-column')}>
            <div className={cx('album-header-label')}>
              {I18nService.getString('label_album_header')}
            </div>
            <div className={cx('album-header-name')}>
              <TextClamp>
                {mediaSelectedAlbum.album_name}
              </TextClamp>
            </div>
            <div className={cx('album-header-artist')}>
              <MediaArtistLink mediaArtist={mediaSelectedAlbum.album_artist}/>
            </div>
            {mediaSelectedAlbum.album_genre && (
              <div className={cx('album-header-genres')}>
                {mediaSelectedAlbum.album_genre.split(',').map(genre => (
                  <span key={genre} className={cx('album-genre-chip')}>
                    {genre.trim()}
                  </span>
                ))}
              </div>
            )}
            <div className={cx('album-header-actions')}>
              <Button
                variant={['rounded', 'outline']}
                tooltip={I18nService.getString('tooltip_edit_album')}
                onButtonSubmit={() => {
                  showModal(MediaAlbumEditModal, {
                    mediaAlbumId: mediaSelectedAlbum.id,
                  }, {
                    onComplete: (result) => {
                      if (!result?.updatedAlbum) {
                        return;
                      }

                      MediaTrackService.loadMediaAlbumTracks(result.updatedAlbum.id);
                    },
                  });
                }}
              >
                <Icon name={Icons.Edit}/>
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className={cx('album-actions')}>
        <MediaCollectionActions
          mediaItem={MediaCollectionService.getMediaItemFromAlbum(mediaSelectedAlbum)}
          hasTracks={!isEmpty(mediaSelectedAlbumTracks)}
        />
      </div>
      <div className={cx('album-tracklist')}>
        <MediaTrackList
          mediaTracks={mediaSelectedAlbumTracks}
          mediaTrackList={{
            id: mediaSelectedAlbum.id,
          }}
          contextMenuItems={[
            MediaTrackContextMenuItem.Like,
            MediaTrackContextMenuItem.AddToQueue,
            MediaTrackContextMenuItem.AddToPlaylist,
          ]}
          disableCovers
          disableAlbumLinks
        />
      </div>
    </div>
  );
}

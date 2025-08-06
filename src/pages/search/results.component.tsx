import React from 'react';
import classNames from 'classnames/bind';

import { I18nService } from '../../services';

import {
  IMediaAlbum,
  IMediaArtist,
  IMediaPlaylist,
  IMediaTrack,
} from '../../interfaces';

import {
  MediaAlbums,
  MediaArtists, MediaPlaylists,
  MediaTrackContextMenuItem,
  MediaTracks,
} from '../../components';

import styles from './results.component.css';

const cx = classNames.bind(styles);

export function TracksSearchResults({ tracks }: {
  tracks: IMediaTrack[],
}) {
  return (
    <div className={cx('row', 'search-results-section')}>
      <div className="col-12">
        <div className="row">
          <div className={cx('col-12', 'search-results-heading')}>
            {I18nService.getString('search_result_heading_tracks')}
          </div>
        </div>
        <div className="row">
          <div className={cx('col-12', 'search-results-content')}>
            <MediaTracks
              mediaTracks={tracks}
              mediaTrackList={{
                // provide consistent id to this tracklist to maintain playback state
                // it can be anything, just keep it consistent
                id: 'search-results',
              }}
              contextMenuItems={[
                MediaTrackContextMenuItem.AddToQueue,
                MediaTrackContextMenuItem.Separator,
                MediaTrackContextMenuItem.AddToPlaylist,
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ArtistsSearchResults({ artists }: {
  artists: IMediaArtist[],
}) {
  return (
    <div className={cx('row', 'search-results-section')}>
      <div className="col-12">
        <div className="row">
          <div className={cx('col-12', 'search-results-heading')}>
            {I18nService.getString('search_result_heading_artists')}
          </div>
        </div>
        <div className="row">
          <div className={cx('col-12', 'search-results-content')}>
            <MediaArtists mediaArtists={artists}/>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AlbumsSearchResults({ albums }: {
  albums: IMediaAlbum[],
}) {
  return (
    <div className={cx('row', 'search-results-section')}>
      <div className="col-12">
        <div className="row">
          <div className={cx('col-12', 'search-results-heading')}>
            {I18nService.getString('search_result_heading_albums')}
          </div>
        </div>
        <div className="row">
          <div className={cx('col-12', 'search-results-content')}>
            <MediaAlbums mediaAlbums={albums}/>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PlaylistsSearchResults({ playlists }: {
  playlists: IMediaPlaylist[],
}) {
  return (
    <div className={cx('row', 'search-results-section')}>
      <div className="col-12">
        <div className="row">
          <div className={cx('col-12', 'search-results-heading')}>
            {I18nService.getString('search_result_heading_playlists')}
          </div>
        </div>
        <div className="row">
          <div className={cx('col-12', 'search-results-content')}>
            <MediaPlaylists mediaPlaylists={playlists}/>
          </div>
        </div>
      </div>
    </div>
  );
}

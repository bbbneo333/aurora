import React from 'react';
import classNames from 'classnames/bind';
import { take } from 'lodash';

import { I18nService } from '../../services';

import {
  IMediaAlbum,
  IMediaArtist,
  IMediaPlaylist,
  IMediaTrack,
} from '../../interfaces';

import {
  MediaAlbums,
  MediaArtists,
  MediaPlaylists,
  MediaTrackContextMenuItem,
  MediaTrackList,
} from '../../components';

import styles from './results.component.css';

const cx = classNames.bind(styles);

const defaultResultTrim = 5;

export function TracksSearchResults({ tracks, trim }: {
  tracks: IMediaTrack[],
  trim?: boolean,
}) {
  return (
    <div className={cx('row', 'search-results-section')}>
      <div className="col-12">
        {trim && (
          <div className="row">
            <div className={cx('col-12', 'search-results-heading')}>
              {I18nService.getString('search_result_heading_tracks')}
            </div>
          </div>
        )}
        <div className="row">
          <div className={cx('col-12', 'search-results-content')}>
            <MediaTrackList
              mediaTracks={trim ? take(tracks, defaultResultTrim) : tracks}
              mediaTrackList={{
                // provide consistent id to this tracklist to maintain playback state
                // it can be anything, just keep it consistent
                id: 'search-results',
              }}
              mediaTrackContextMenuItems={[
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

export function ArtistsSearchResults({ artists, trim }: {
  artists: IMediaArtist[],
  trim?: boolean,
}) {
  return (
    <div className={cx('row', 'search-results-section')}>
      <div className="col-12">
        {trim && (
          <div className="row">
            <div className={cx('col-12', 'search-results-heading')}>
              {I18nService.getString('search_result_heading_artists')}
            </div>
          </div>
        )}
        <div className="row">
          <div className={cx('col-12', 'search-results-content')}>
            <MediaArtists mediaArtists={trim ? take(artists, defaultResultTrim) : artists}/>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AlbumsSearchResults({ albums, trim }: {
  albums: IMediaAlbum[],
  trim?: boolean,
}) {
  return (
    <div className={cx('row', 'search-results-section')}>
      <div className="col-12">
        {trim && (
          <div className="row">
            <div className={cx('col-12', 'search-results-heading')}>
              {I18nService.getString('search_result_heading_albums')}
            </div>
          </div>
        )}
        <div className="row">
          <div className={cx('col-12', 'search-results-content')}>
            <MediaAlbums mediaAlbums={trim ? take(albums, defaultResultTrim) : albums}/>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PlaylistsSearchResults({ playlists, trim }: {
  playlists: IMediaPlaylist[],
  trim?: boolean,
}) {
  return (
    <div className={cx('row', 'search-results-section')}>
      <div className="col-12">
        {trim && (
          <div className="row">
            <div className={cx('col-12', 'search-results-heading')}>
              {I18nService.getString('search_result_heading_playlists')}
            </div>
          </div>
        )}
        <div className="row">
          <div className={cx('col-12', 'search-results-content')}>
            <MediaPlaylists mediaPlaylists={trim ? take(playlists, defaultResultTrim) : playlists}/>
          </div>
        </div>
      </div>
    </div>
  );
}

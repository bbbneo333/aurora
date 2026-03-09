import React, { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import { useSelector } from 'react-redux';
import classNames from 'classnames/bind';
import _ from 'lodash';

import {
  Button,
  Icon,
  MediaAlbums,
  Slider,
} from '../../components';
import { MediaTrackDatastore } from '../../datastores';
import { RootState } from '../../reducers';
import { I18nService, MediaAlbumService } from '../../services';
import { IMediaAlbum } from '../../interfaces';
import { Icons } from '../../constants';

import styles from './albums.component.css';

const cx = classNames.bind(styles);

type SortOption = 'artist' | 'album' | 'year' | 'added';
type SortDirection = 'asc' | 'desc';

interface IAlbumsViewSettings {
  sortBy: SortOption;
  sortDirection: SortDirection;
  coverSize: number;
}

const SETTINGS_KEY = 'aurora:albums-view-settings';
const TOP_BAR_SEARCH_MIN_QUERY_LENGTH = 5;
const TOP_BAR_SEARCH_STATE_KEY = 'aurora:topbar-search-query';
const TOP_BAR_SEARCH_CHANGE_EVENT = 'aurora:topbar-search-changed';

const DEFAULT_SETTINGS: IAlbumsViewSettings = {
  sortBy: 'artist',
  sortDirection: 'asc',
  coverSize: 200,
};

function AlbumsHeaderControls({ settings, updateSettings }: {
  settings: IAlbumsViewSettings,
  updateSettings: (partial: Partial<IAlbumsViewSettings>) => void
}) {
  const container = document.getElementById('browser-header-inline-controls')
    || document.getElementById('library-header-controls');
  if (!container) return null;

  return ReactDOM.createPortal(
    <div className={cx('albums-controls')}>
      <div className={cx('albums-sort-control')}>
        <select
          className={cx('albums-select')}
          value={settings.sortBy}
          onChange={e => updateSettings({ sortBy: e.target.value as SortOption })}
        >
          <option value="artist">{I18nService.getString('label_album_sort_artist')}</option>
          <option value="album">{I18nService.getString('label_album_sort_album')}</option>
          <option value="year">{I18nService.getString('label_album_sort_year')}</option>
          <option value="added">{I18nService.getString('label_album_sort_added')}</option>
        </select>
        <Button
          icon={settings.sortDirection === 'asc' ? Icons.SortAsc : Icons.SortDesc}
          variant={['rounded', 'outline']}
          onButtonSubmit={() => updateSettings({
            sortDirection: settings.sortDirection === 'asc' ? 'desc' : 'asc',
          })}
          tooltip={I18nService.getString('tooltip_album_sort_toggle')}
        />
      </div>
      <div className={cx('albums-size-control')}>
        <Icon name={Icons.Image}/>
        <div className={cx('albums-size-slider')}>
          <Slider
            sliderContainerClassName={cx('albums-slider-instance')}
            sliderTrackClassName={cx('albums-slider-track')}
            sliderThumbClassName={cx('albums-slider-thumb')}
            value={settings.coverSize}
            maxValue={400}
            onDragCommit={value => updateSettings({ coverSize: Math.max(100, value) })}
            autoCommitOnUpdate
          />
        </div>
      </div>
    </div>,
    container,
  );
}

export function AlbumsPage() {
  const { mediaAlbums } = useSelector((state: RootState) => state.mediaLibrary);
  const [settings, setSettings] = useState<IAlbumsViewSettings>(DEFAULT_SETTINGS);
  const [topBarSearchQuery, setTopBarSearchQuery] = useState(() => localStorage.getItem(TOP_BAR_SEARCH_STATE_KEY) || '');
  const [trackMatchedAlbumIds, setTrackMatchedAlbumIds] = useState<string[]>([]);

  useEffect(() => {
    MediaAlbumService.loadMediaAlbums();
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      try {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
      } catch (e) {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    const handleTopBarSearchChange = (event: Event) => {
      const searchEvent = event as CustomEvent<{ query?: string }>;
      const nextQuery = String(searchEvent.detail?.query || '');
      setTopBarSearchQuery(nextQuery);
    };

    window.addEventListener(TOP_BAR_SEARCH_CHANGE_EVENT, handleTopBarSearchChange as EventListener);
    return () => window.removeEventListener(TOP_BAR_SEARCH_CHANGE_EVENT, handleTopBarSearchChange as EventListener);
  }, []);

  const normalizedTopBarSearchQuery = topBarSearchQuery.toLowerCase().trim();
  const canApplyTopBarFilter = normalizedTopBarSearchQuery.length >= TOP_BAR_SEARCH_MIN_QUERY_LENGTH;
  const topBarSearchTerms = useMemo(() => normalizedTopBarSearchQuery
    .split(/\s+/)
    .map(term => term.trim())
    .filter(Boolean), [normalizedTopBarSearchQuery]);

  useEffect(() => {
    if (!canApplyTopBarFilter) {
      setTrackMatchedAlbumIds([]);
      return () => {};
    }

    let isCancelled = false;
    const timeoutId = window.setTimeout(() => {
      MediaTrackDatastore.findMediaTracks().then((mediaTrackDataList) => {
        if (isCancelled) {
          return;
        }

        const matchedAlbumIds = _.uniq(
          mediaTrackDataList
            .filter((mediaTrackData) => {
              const trackName = String(mediaTrackData.track_name || '').toLowerCase().trim();
              if (!trackName) {
                return false;
              }

              if (trackName.includes(normalizedTopBarSearchQuery)) {
                return true;
              }

              return topBarSearchTerms.every(term => trackName.includes(term));
            })
            .map(mediaTrackData => mediaTrackData.track_album_id),
        );

        setTrackMatchedAlbumIds(matchedAlbumIds);
      });
    }, 130);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [
    canApplyTopBarFilter,
    normalizedTopBarSearchQuery,
    topBarSearchTerms,
  ]);

  const updateSettings = (partial: Partial<IAlbumsViewSettings>) => {
    const newSettings = { ...settings, ...partial };
    setSettings(newSettings);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
  };

  const filteredAlbums = useMemo(() => {
    if (!canApplyTopBarFilter) {
      return mediaAlbums;
    }

    const matchedAlbumIdSet = new Set(trackMatchedAlbumIds);

    return mediaAlbums.filter((album) => {
      const albumName = String(album.album_name || '').toLowerCase().trim();
      const artistName = String(album.album_artist?.artist_name || '').toLowerCase().trim();
      const combined = `${albumName} ${artistName}`.trim();
      if (combined.includes(normalizedTopBarSearchQuery)) {
        return true;
      }

      if (topBarSearchTerms.every(term => combined.includes(term))) {
        return true;
      }

      return matchedAlbumIdSet.has(album.id);
    });
  }, [
    canApplyTopBarFilter,
    mediaAlbums,
    normalizedTopBarSearchQuery,
    topBarSearchTerms,
    trackMatchedAlbumIds,
  ]);

  const sortedAlbums = useMemo(() => {
    let iteratee: any;
    switch (settings.sortBy) {
      case 'artist':
        iteratee = (a: any) => a.album_artist.artist_name.toLowerCase();
        break;
      case 'album':
        iteratee = (a: any) => a.album_name.toLowerCase();
        break;
      case 'year':
        iteratee = 'album_year';
        break;
      case 'added':
        iteratee = 'sync_timestamp';
        break;
      default:
        iteratee = (a: any) => a.album_artist.artist_name.toLowerCase();
    }

    return (_.orderBy(filteredAlbums, [iteratee], [settings.sortDirection]) || []) as IMediaAlbum[];
  }, [
    filteredAlbums,
    settings.sortBy,
    settings.sortDirection,
  ]);

  // Read hideArtist setting from UI settings
  const [hideArtist, setHideArtist] = useState(false);
  useEffect(() => {
    const checkSettings = () => {
      const saved = localStorage.getItem('aurora:ui-settings');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setHideArtist(!!parsed.hideArtist);
        } catch (e) { /* ignore */ }
      }
    };
    checkSettings();
    window.addEventListener('aurora:settings-changed', checkSettings);
    return () => window.removeEventListener('aurora:settings-changed', checkSettings);
  }, []);

  return (
    <div className="container-fluid">
      <AlbumsHeaderControls settings={settings} updateSettings={updateSettings}/>
      <MediaAlbums mediaAlbums={sortedAlbums} coverSize={settings.coverSize} hideArtist={hideArtist}/>
    </div>
  );
}

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import classNames from 'classnames/bind';
import { useHistory, useLocation } from 'react-router-dom';

import routes from '../app.routes';

import {
  BrowserNavigation,
  Button,
  Icon,
  TextInput,
  RouterSwitchComponent,
} from '../../components';
import { IMediaTrack } from '../../interfaces';
import { usePersistentScroll } from '../../hooks';
import {
  I18nService,
  MediaLibraryService,
  MediaPlayerService,
  MediaTrackService,
} from '../../services';
import { Icons, Routes } from '../../constants';
import MediaLocalLibraryService from '../../providers/media-local/media-local-library.service';
import { StringUtils } from '../../utils';

import styles from './browser.component.css';

const cx = classNames.bind(styles);
const TopBarSearchMinQueryLength = 5;
const TopBarSearchResultLimit = 8;
const TopBarSearchDebounceMs = 150;
const TopBarSearchStateKey = 'aurora:topbar-search-query';
const TopBarSearchChangeEvent = 'aurora:topbar-search-changed';

function BrowserLinks() {
  return (
    <RouterSwitchComponent routes={routes.header}/>
  );
}

function BrowserSearch() {
  const history = useHistory();
  const location = useLocation();
  const isSettingsPage = location.pathname === Routes.Settings;
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRequestRef = useRef(0);

  const [query, setQuery] = useState(() => localStorage.getItem(TopBarSearchStateKey) || '');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<IMediaTrack[]>([]);

  const trimmedQuery = query.trim();
  const canSearch = trimmedQuery.length >= TopBarSearchMinQueryLength;

  const submitSearchRoute = useCallback((searchQuery: string) => {
    history.push(StringUtils.buildRoute(Routes.Search, {}, {
      q: searchQuery,
    }));
  }, [history]);

  useEffect(() => {
    if (!canSearch) {
      setResults([]);
      setIsLoading(false);
      return () => {};
    }

    const requestId = searchRequestRef.current + 1;
    searchRequestRef.current = requestId;
    setIsLoading(true);
    setIsOpen(true);

    const timeoutId = window.setTimeout(() => {
      MediaTrackService.searchTracksByQuery(trimmedQuery, TopBarSearchResultLimit)
        .then((tracks) => {
          if (searchRequestRef.current === requestId) {
            setResults(tracks);
          }
        })
        .finally(() => {
          if (searchRequestRef.current === requestId) {
            setIsLoading(false);
          }
        });
    }, TopBarSearchDebounceMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    canSearch,
    trimmedQuery,
  ]);

  useEffect(() => {
    if (isSettingsPage) {
      setIsOpen(false);
      return;
    }

    const queryToBroadcast = canSearch ? trimmedQuery : '';
    localStorage.setItem(TopBarSearchStateKey, queryToBroadcast);
    window.dispatchEvent(new CustomEvent(TopBarSearchChangeEvent, {
      detail: {
        query: queryToBroadcast,
      },
    }));
  }, [
    canSearch,
    isSettingsPage,
    trimmedQuery,
  ]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [
    location.pathname,
    location.search,
  ]);

  if (isSettingsPage) {
    return null;
  }

  return (
    <div ref={containerRef} className={cx('browser-search')}>
      <TextInput
        clearable
        className={cx('browser-search-input')}
        placeholder={I18nService.getString('placeholder_search_input')}
        icon={Icons.Search}
        onInputValue={value => setQuery(value)}
        onFocus={() => setIsOpen(canSearch)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            setIsOpen(false);
            return;
          }

          if (event.key === 'Enter' && canSearch) {
            submitSearchRoute(trimmedQuery);
            setIsOpen(false);
          }
        }}
      />
      {isOpen && canSearch && (
        <div className={cx('browser-search-results')}>
          {isLoading && (
            <div className={cx('browser-search-status')}>
              ...
            </div>
          )}
          {!isLoading && results.length === 0 && (
            <div className={cx('browser-search-status')}>
              {I18nService.getString('search_result_heading_tracks')}
              : 0
            </div>
          )}
          {!isLoading && results.map(track => (
            <button
              key={track.id}
              type="button"
              className={cx('browser-search-result')}
              onClick={() => {
                MediaPlayerService.playMediaTrack(track);
                history.push(StringUtils.buildRoute(Routes.LibraryAlbum, {
                  albumId: track.track_album.id,
                }));
                setIsOpen(false);
              }}
            >
              <span className={cx('browser-search-result-title')}>
                {track.track_name}
              </span>
              <span className={cx('browser-search-result-meta')}>
                {track.track_artists.map(artist => artist.artist_name).join(', ')}
                {' • '}
                {track.track_album.album_name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function BrowserHeader() {
  const [isSyncRunning, setIsSyncRunning] = useState(false);

  return (
    <div className={cx('browser-header', 'app-window-drag')}>
      <BrowserNavigation/>
      <BrowserSearch/>
      <div id="browser-header-inline-controls" className={cx('browser-header-inline-controls')}/>
      <div className={cx('browser-header-actions')}>
        <div id="browser-header-context-actions" className={cx('browser-header-context-actions')}/>
        <BrowserLinks/>
        <Button
          variant={['rounded', 'outline']}
          tooltip="Bibliothek und DAP synchronisieren"
          disabled={isSyncRunning}
          onButtonSubmit={() => {
            if (isSyncRunning) {
              return;
            }

            setIsSyncRunning(true);
            MediaLocalLibraryService.syncMediaTracks()
              .then(async () => {
                const dapSettings = MediaLibraryService.getDapSyncSettings();
                if (!dapSettings.targetDirectory) {
                  return;
                }

                await MediaLibraryService.syncDapLibrary({
                  targetDirectory: dapSettings.targetDirectory,
                  deleteMissingOnDevice: dapSettings.deleteMissingOnDevice,
                });
              })
              .catch((error) => {
                console.error('Kombinierte Synchronisierung fehlgeschlagen', error);
              })
              .finally(() => {
                setIsSyncRunning(false);
              });
          }}
        >
          <Icon name={isSyncRunning ? Icons.Refreshing : Icons.Refresh}/>
        </Button>
      </div>
    </div>
  );
}

function BrowserViewport() {
  const viewportRef = useRef(null);
  usePersistentScroll({ viewportRef });

  return (
    <div ref={viewportRef} className={cx('browser-viewport', 'app-scrollable')}>
      <RouterSwitchComponent routes={routes.main}/>
    </div>
  );
}

export function Browser() {
  return (
    <div className={cx('browser')}>
      <BrowserHeader/>
      <BrowserViewport/>
    </div>
  );
}

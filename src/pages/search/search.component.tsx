import React, { useCallback, useEffect, useState } from 'react';
import classNames from 'classnames/bind';
import { isEmpty } from 'lodash';
import { useHistory, useLocation } from 'react-router-dom';

import { TextInput, NavigationPills } from '../../components';
import { Icons, Routes } from '../../constants';
import { I18nService, MediaLibraryService } from '../../services';
import { StringUtils } from '../../utils';
import { MediaSearchResults } from '../../services/media-library.service';

import styles from './search.component.css';

import {
  AlbumsSearchResults,
  ArtistsSearchResults,
  PlaylistsSearchResults,
  TracksSearchResults,
} from './results.component';

const cx = classNames.bind(styles);

const useQuery = () => {
  const params = new URLSearchParams(useLocation().search);
  return params.get('q') || '';
};

const buildQueryPath = (query: string) => StringUtils.buildRoute(Routes.Search, {}, {
  q: query,
});

export function SearchPage() {
  const history = useHistory();
  const query = useQuery();

  const [searchInput, setSearchInput] = React.useState(query);
  const [searchLoading, setSearchLoading] = React.useState(false);
  const [searchResults, setSearchResults] = React.useState<Partial<MediaSearchResults>>({});
  const [searchCategory, setSearchCategory] = useState('all');
  const isSearchingAll = searchCategory === 'all';

  useEffect(() => {
    console.log({ searchLoading, searchResults });
  }, [
    searchLoading,
    searchResults,
  ]);

  const search = useCallback((searchTerm) => {
    setSearchCategory('all');

    if (isEmpty(searchTerm)) {
      setSearchResults({});
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);

    MediaLibraryService.search(searchTerm)
      .then((results) => {
        setSearchResults(results);
        history.replace(buildQueryPath(searchTerm));
      })
      .finally(() => setSearchLoading(false));
  }, []);

  useEffect(() => {
    search(searchInput.trim());
  }, [
    search,
    searchInput,
  ]);

  return (
    <div className="container-fluid">
      <div className={cx('row', 'search-header')}>
        <div className="col-12">
          <TextInput
            focus
            clearable
            className={cx('search-input')}
            placeholder={I18nService.getString('placeholder_search_input')}
            value={searchInput}
            onInputValue={value => setSearchInput(value)}
            icon={Icons.Search}
            iconClassName={cx('search-input-icon')}
          />
        </div>
      </div>
      <div className={cx('row', 'navigation-header')}>
        <div className="col-12">
          <NavigationPills
            items={[
              {
                id: 'all',
                label: I18nService.getString('search_result_heading_all'),
              },
              {
                id: 'tracks',
                label: I18nService.getString('search_result_heading_tracks'),
                count: searchResults.tracks?.length,
                disabled: !searchResults.tracks?.length,
              },
              {
                id: 'artists',
                label: I18nService.getString('search_result_heading_artists'),
                count: searchResults.artists?.length,
                disabled: !searchResults.artists?.length,
              },
              {
                id: 'albums',
                label: I18nService.getString('search_result_heading_albums'),
                count: searchResults.albums?.length,
                disabled: !searchResults.albums?.length,
              },
              {
                id: 'playlists',
                label: I18nService.getString('search_result_heading_playlists'),
                count: searchResults.playlists?.length,
                disabled: !searchResults.playlists?.length,
              },
            ]}
            selected={searchCategory}
            onSelectItem={setSearchCategory}
          />
        </div>
      </div>
      <div className={cx('row', 'search-content')}>
        <div className="col-12">
          {searchResults.tracks && !isEmpty(searchResults.tracks) && (searchCategory === 'tracks' || isSearchingAll) && (
            <TracksSearchResults
              tracks={searchResults.tracks}
              trim={isSearchingAll}
            />
          )}
          {searchResults.artists && !isEmpty(searchResults.artists) && (searchCategory === 'artists' || isSearchingAll) && (
            <ArtistsSearchResults
              artists={searchResults.artists}
              trim={isSearchingAll}
            />
          )}
          {searchResults.albums && !isEmpty(searchResults.albums) && (searchCategory === 'albums' || isSearchingAll) && (
            <AlbumsSearchResults
              albums={searchResults.albums}
              trim={isSearchingAll}
            />
          )}
          {searchResults.playlists && !isEmpty(searchResults.playlists) && (searchCategory === 'playlists' || isSearchingAll) && (
            <PlaylistsSearchResults
              playlists={searchResults.playlists}
              trim={isSearchingAll}
            />
          )}
        </div>
      </div>
    </div>
  );
}

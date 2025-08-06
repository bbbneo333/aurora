import React, { useCallback, useEffect, useState } from 'react';
import classNames from 'classnames/bind';
import { isEmpty } from 'lodash';
import { useHistory, useLocation } from 'react-router-dom';

import { TextInput } from '../../components';
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

import { NavigationPills } from './navigation.component';

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
  const [searchCategory, setSearchCategory] = useState<string>();
  const searchingAll = searchCategory === 'all';

  useEffect(() => {
    console.log({ searchLoading, searchResults });
  }, [
    searchLoading,
    searchResults,
  ]);

  const search = useCallback((searchTerm) => {
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
            categories={[
              {
                id: 'all',
                label: I18nService.getString('search_result_heading_all'),
              },
              {
                id: 'tracks',
                label: I18nService.getString('search_result_heading_tracks'),
                count: searchResults.tracks?.length,
              },
              {
                id: 'artists',
                label: I18nService.getString('search_result_heading_artists'),
                count: searchResults.artists?.length,
              },
              {
                id: 'albums',
                label: I18nService.getString('search_result_heading_albums'),
                count: searchResults.albums?.length,
              },
              {
                id: 'playlists',
                label: I18nService.getString('search_result_heading_playlists'),
                count: searchResults.playlists?.length,
              },
            ]}
            selected={searchCategory}
            onSelectCategory={setSearchCategory}
          />
        </div>
      </div>
      <div className={cx('row', 'search-content')}>
        <div className="col-12">
          {searchResults.tracks && !isEmpty(searchResults.tracks) && (searchCategory === 'tracks' || searchingAll) && (
            <TracksSearchResults
              tracks={searchResults.tracks}
              trim={searchingAll}
            />
          )}
          {searchResults.artists && !isEmpty(searchResults.artists) && (searchCategory === 'artists' || searchingAll) && (
            <ArtistsSearchResults
              artists={searchResults.artists}
              trim={searchingAll}
            />
          )}
          {searchResults.albums && !isEmpty(searchResults.albums) && (searchCategory === 'albums' || searchingAll) && (
            <AlbumsSearchResults
              albums={searchResults.albums}
              trim={searchingAll}
            />
          )}
          {searchResults.playlists && !isEmpty(searchResults.playlists) && (searchCategory === 'playlists' || searchingAll) && (
            <PlaylistsSearchResults
              playlists={searchResults.playlists}
              trim={searchingAll}
            />
          )}
        </div>
      </div>
    </div>
  );
}

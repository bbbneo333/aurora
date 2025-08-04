import React, { useCallback, useEffect } from 'react';
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
      <div className="row">
        <div className="col-12">
          {searchResults.tracks && !isEmpty(searchResults.tracks) && (
            <TracksSearchResults tracks={searchResults.tracks}/>
          )}
          {searchResults.artists && !isEmpty(searchResults.artists) && (
            <ArtistsSearchResults artists={searchResults.artists}/>
          )}
          {searchResults.albums && !isEmpty(searchResults.albums) && (
            <AlbumsSearchResults albums={searchResults.albums}/>
          )}
          {searchResults.playlists && !isEmpty(searchResults.playlists) && (
            <PlaylistsSearchResults playlists={searchResults.playlists}/>
          )}
        </div>
      </div>
    </div>
  );
}

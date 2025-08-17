import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { RootState } from '../../reducers';
import { MediaLibraryService } from '../../services';
import { MediaArtists } from '../../components';

export function ArtistsPage() {
  const { mediaArtists } = useSelector((state: RootState) => state.mediaLibrary);

  useEffect(() => {
    MediaLibraryService.loadMediaArtists();
  }, []);

  return (
    <div className="container-fluid">
      <div className="row">
        <MediaArtists mediaArtists={mediaArtists}/>
      </div>
    </div>
  );
}

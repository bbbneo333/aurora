import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { MediaArtists } from '../../components';
import { RootState } from '../../reducers';
import { MediaArtistService } from '../../services';

export function ArtistsPage() {
  const mediaArtists = useSelector((state: RootState) => state.mediaLibrary.mediaArtists);

  useEffect(() => {
    MediaArtistService.loadMediaArtists();
  }, []);

  return (
    <div className="container-fluid">
      <MediaArtists mediaArtists={mediaArtists}/>
    </div>
  );
}

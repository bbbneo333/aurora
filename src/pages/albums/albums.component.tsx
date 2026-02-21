import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { MediaAlbums } from '../../components';
import { RootState } from '../../reducers';
import { MediaAlbumService } from '../../services';

export function AlbumsPage() {
  const { mediaAlbums } = useSelector((state: RootState) => state.mediaLibrary);

  useEffect(() => {
    MediaAlbumService.loadMediaAlbums();
  }, []);

  return (
    <div className="container-fluid">
      <MediaAlbums mediaAlbums={mediaAlbums}/>
    </div>
  );
}

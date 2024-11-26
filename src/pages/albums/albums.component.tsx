import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { MediaAlbums } from '../../components';
import { RootState } from '../../reducers';
import { MediaLibraryService } from '../../services';

export function AlbumsPage() {
  const { mediaAlbums } = useSelector((state: RootState) => state.mediaLibrary);

  useEffect(() => {
    MediaLibraryService.loadMediaAlbums();
  }, []);

  return (
    <div className="container-fluid">
      <MediaAlbums mediaAlbums={mediaAlbums}/>
    </div>
  );
}

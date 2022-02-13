import React, {useEffect} from 'react';
import {useSelector} from 'react-redux';

import {MediaAlbumTile} from '../../components';
import {RootState} from '../../reducers';
import {MediaLibraryService} from '../../services';

export function LibraryAlbumsComponent() {
  const {mediaAlbums} = useSelector((state: RootState) => state.mediaLibrary);

  useEffect(() => {
    MediaLibraryService.loadMediaAlbums();
  }, []);

  return (
    <div className="container-fluid">
      <div className="row">
        {mediaAlbums.map(mediaAlbum => (
          <MediaAlbumTile
            key={mediaAlbum.id}
            mediaAlbum={mediaAlbum}
          />
        ))}
      </div>
    </div>
  );
}

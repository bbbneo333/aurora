import React from 'react';
import {useSelector} from 'react-redux';

import {MediaAlbumTile} from '../../components';
import {RootState} from '../../reducers';

export function LibraryAlbumsComponent() {
  const {mediaAlbums} = useSelector((state: RootState) => state.mediaLibrary);

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

import React, {useEffect} from 'react';
import {useSelector} from 'react-redux';

import {MediaAlbumTile, MediaAlbumContextMenu} from '../../components';
import {RootState} from '../../reducers';
import {MediaLibraryService} from '../../services';
import {MediaAlbumContextMenuItem} from '../../components/media-album-context-menu/media-album-context-menu.component';

enum MediaContextMenus {
  Album = 'media_album_context_menu',
}

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
            mediaAlbumContextMenuId={MediaContextMenus.Album}
          />
        ))}
      </div>
      <MediaAlbumContextMenu
        id={MediaContextMenus.Album}
        menuItems={[
          MediaAlbumContextMenuItem.AddToQueue,
          MediaAlbumContextMenuItem.Separator,
          MediaAlbumContextMenuItem.AddToPlaylist,
        ]}
      />
    </div>
  );
}

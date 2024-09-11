import { Routes } from '../../constants';

import { LibraryArtistsComponent } from '../library-artists/library-artists.component';
import { LibraryAlbumsComponent } from '../library-albums/library-albums.component';
import { LibraryAlbumComponent } from '../library-album/library-album.component';

export default [
  {
    path: Routes.LibraryArtists,
    component: LibraryArtistsComponent,
    tHeaderName: 'link_library_artists',
    exact: true,
  },
  {
    path: Routes.LibraryAlbums,
    component: LibraryAlbumsComponent,
    tHeaderName: 'link_library_albums',
    exact: true,
  },
  {
    path: Routes.LibraryAlbum,
    component: LibraryAlbumComponent,
    exact: true,
  },
  {
    path: Routes.Library,
    redirect: Routes.LibraryAlbums,
  },
];

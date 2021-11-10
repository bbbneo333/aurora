import {Routes} from '../../constants';

import {LibraryArtistsComponent} from '../library-artists/library-artists.component';
import {LibraryAlbumsComponent} from '../library-albums/library-albums.component';
import {LibraryAlbumComponent} from '../library-album/library-album.component';

export type LibraryRoute = {
  path: string,
  main: () => JSX.Element,
  tHeaderName?: string,
};

export default [
  {
    path: Routes.LibraryArtists,
    main: LibraryArtistsComponent,
    tHeaderName: 'link_library_artists',
  },
  {
    path: Routes.LibraryAlbums,
    main: LibraryAlbumsComponent,
    tHeaderName: 'link_library_albums',
  },
  {
    path: Routes.LibraryAlbum,
    main: LibraryAlbumComponent,
  },
] as LibraryRoute[];

import {Routes} from '../../constants';

import {LibraryArtistsComponent} from '../library-artists/library-artists.component';
import {LibraryAlbumsComponent} from '../library-albums/library-albums.component';

export type LibraryRoute = {
  path: string,
  main: () => JSX.Element,
  tName: string,
};

export default [
  {
    path: Routes.LibraryArtists,
    main: LibraryArtistsComponent,
    tName: 'link_library_artists',
  },
  {
    path: Routes.LibraryAlbums,
    main: LibraryAlbumsComponent,
    tName: 'link_library_albums',
  },
] as LibraryRoute[];

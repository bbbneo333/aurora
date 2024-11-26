import { Routes } from '../../constants';

import { LibraryArtistsPage } from '../library-artists/library-artists.component';
import { LibraryAlbumsPage } from '../library-albums/library-albums.component';
import { LibraryAlbumPage } from '../library-album/library-album.component';
import { LibraryArtistPage } from '../library-artist/library-artist.component';
// import { LibraryPlaylistsPage } from '../library-playlists/library-playlists.component';
// import { LibraryPlaylistPage } from '../library-playlist/library-playlist.component';

export default [
  {
    path: Routes.LibraryArtists,
    component: LibraryArtistsPage,
    tHeaderName: 'link_library_artists',
    exact: true,
  },
  {
    path: Routes.LibraryAlbums,
    component: LibraryAlbumsPage,
    tHeaderName: 'link_library_albums',
    exact: true,
  },
  // TODO: Add this back
  // {
  //   path: Routes.LibraryPlaylists,
  //   component: LibraryPlaylistsPage,
  //   tHeaderName: 'link_library_playlists',
  //   exact: true,
  // },
  // {
  //   path: Routes.LibraryPlaylist,
  //   component: LibraryPlaylistPage,
  //   exact: true,
  // },
  {
    path: Routes.LibraryAlbum,
    component: LibraryAlbumPage,
    exact: true,
  },
  {
    path: Routes.LibraryArtist,
    component: LibraryArtistPage,
    exact: true,
  },
  {
    path: Routes.Library,
    redirect: Routes.LibraryAlbums,
  },
];

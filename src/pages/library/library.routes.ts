import { Routes } from '../../constants';

import { ArtistPage } from '../artist/artist.component';
import { ArtistsPage } from '../artists/artists.component';
import { AlbumPage } from '../album/album.component';
import { AlbumsPage } from '../albums/albums.component';

// import { LibraryPlaylistsPage } from '../library-playlists/library-playlists.component';
// import { LibraryPlaylistPage } from '../library-playlist/library-playlist.component';

export default [
  {
    path: Routes.LibraryArtists,
    component: ArtistsPage,
    tHeaderName: 'link_library_artists',
    exact: true,
  },
  {
    path: Routes.LibraryAlbums,
    component: AlbumsPage,
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
    component: AlbumPage,
    exact: true,
  },
  {
    path: Routes.LibraryArtist,
    component: ArtistPage,
    exact: true,
  },
  {
    path: Routes.Library,
    redirect: Routes.LibraryAlbums,
  },
];

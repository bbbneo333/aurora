import { Icons, Routes } from '../constants';
import * as AppPages from '../pages';

export default {
  main: [
    {
      path: Routes.Library,
      component: AppPages.LibraryPage,
    },
    {
      path: Routes.Settings,
      component: AppPages.SettingsPage,
    },
    {
      path: Routes.Player,
      component: AppPages.PlayerPage,
    },
    {
      path: Routes.Podcasts,
      component: AppPages.PodcastsPage,
    },
    {
      path: Routes.Search,
      component: AppPages.SearchPage,
    },
    {
      path: Routes.AudioCd,
      component: AppPages.AudioCdPage,
    },
    {
      path: '/',
      redirect: Routes.Library,
    },
  ],
  header: [
    {
      path: Routes.Library,
      component: AppPages.LibraryHeader,
    },
    {
      path: Routes.AudioCd,
      component: AppPages.AudioCdHeader,
    },
    {
      path: Routes.PlayerQueue,
      component: AppPages.PlayerHeader,
    },
    {
      path: Routes.Podcasts,
      component: AppPages.PodcastsHeader,
    },
  ],
  sidebar: [
    {
      path: Routes.Library,
      name: 'link_library',
      icon: Icons.LinkLibrary,
    },
    {
      path: Routes.Podcasts,
      name: 'link_podcasts',
      icon: Icons.Podcast,
    },
    {
      path: Routes.Settings,
      name: 'link_settings',
      icon: Icons.LinkSettings,
    },
  ],
};

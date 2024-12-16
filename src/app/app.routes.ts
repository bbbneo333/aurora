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
      path: Routes.PlayerQueue,
      component: AppPages.PlayerHeader,
    },
  ],
  sidebar: [
    {
      path: Routes.Library,
      name: 'link_library',
      icon: Icons.LinkLibrary,
    },
    {
      path: Routes.Settings,
      name: 'link_settings',
      icon: Icons.LinkSettings,
    },
  ],
};

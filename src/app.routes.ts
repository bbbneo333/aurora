import {Routes} from './constants';
import * as AppPages from './pages';

export default {
  main: [
    {
      path: Routes.Library,
      component: AppPages.LibraryComponent,
    },
    {
      path: Routes.Settings,
      component: AppPages.SettingsComponent,
    },
    {
      path: Routes.Player,
      component: AppPages.PlayerComponent,
    },
    {
      path: '/',
      redirect: Routes.Library,
    },
  ],
  header: [
    {
      path: Routes.Library,
      component: AppPages.LibraryHeaderComponent,
    },
    {
      path: Routes.PlayerQueue,
      component: AppPages.PlayerHeaderComponent,
    },
  ],
  sidebar: [
    {
      path: Routes.Library,
      tSidebarLinkName: 'link_library',
      fSidebarLinkIcon: 'fas fa-layer-group',
    },
    {
      path: Routes.Settings,
      tSidebarLinkName: 'link_settings',
      fSidebarLinkIcon: 'fas fa-cog',
    },
  ],
};

import {Routes} from './constants';
import * as AppPages from './pages';

export type AppRoute = {
  path: string,
  main: () => JSX.Element,
  header?: () => JSX.Element,
  tSidebarLinkName: string,
  fSidebarLinkIcon: string,
};

export default [
  {
    path: Routes.Library,
    main: AppPages.LibraryComponent,
    header: AppPages.LibraryHeaderComponent,
    tSidebarLinkName: 'link_library',
    fSidebarLinkIcon: 'fas fa-layer-group',
  },
  {
    path: Routes.Settings,
    main: AppPages.SettingsComponent,
    tSidebarLinkName: 'link_settings',
    fSidebarLinkIcon: 'fas fa-cog',
  },
] as AppRoute[];

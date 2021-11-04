import {Routes} from './constants';
import * as AppPages from './pages';

export type AppRoute = {
  path: string,
  main: () => JSX.Element,
  header?: () => JSX.Element,
  tName: string,
  fIcon: string,
};

export default [
  {
    path: Routes.Library,
    main: AppPages.LibraryComponent,
    header: AppPages.LibraryHeaderComponent,
    tName: 'link_library',
    fIcon: 'fas fa-layer-group',
  },
  {
    path: Routes.Settings,
    main: AppPages.SettingsComponent,
    tName: 'link_settings',
    fIcon: 'fas fa-cog',
  },
] as AppRoute[];

import {Routes} from './constants';
import * as AppPages from './pages';

export type AppRoute = {
  path: string,
  main: () => JSX.Element,
  header?: () => JSX.Element,
  t_name: string,
};

export default [
  {
    path: Routes.Library,
    main: AppPages.LibraryComponent,
    header: AppPages.LibraryHeaderComponent,
    t_name: 'link_library',
  },
  {
    path: Routes.Settings,
    main: AppPages.SettingsComponent,
    t_name: 'link_settings',
  },
] as AppRoute[];

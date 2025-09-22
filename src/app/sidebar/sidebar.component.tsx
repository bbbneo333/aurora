import React from 'react';
import classNames from 'classnames/bind';

import { Icon, MediaPinnedItemList, RouterLink } from '../../components';
import { I18nService } from '../../services';
import routes from '../app.routes';

import styles from './sidebar.component.css';

const cx = classNames.bind(styles);

function SidebarQuickAccess() {
  return (
    <div className={cx('sidebar-quick-access', 'app-scrollable')}>
      <MediaPinnedItemList/>
    </div>
  );
}

// function SidebarBrandingLogo() {
//   return (
//     <div className={cx('sidebar-logo')}/>
//   );
// }

function SidebarNavigationLink(props: {
  route: {
    path: string,
    icon: string,
    name: string,
  }
}) {
  const {
    route: {
      icon,
      name,
      path,
    },
  } = props;

  return (
    <RouterLink
      to={path}
      activeClassName={cx('active')}
      className={cx('sidebar-navigation-item', 'app-nav-link')}
    >
      <span className={cx('sidebar-navigation-item-icon')}>
        <Icon name={icon}/>
      </span>
      <span className={cx('sidebar-navigation-item-label')}>
        {I18nService.getString(name)}
      </span>
    </RouterLink>
  );
}

function SidebarNavigationList() {
  return (
    <div className={cx('sidebar-navigation-list')}>
      {routes.sidebar.map(route => (
        <SidebarNavigationLink key={route.path} route={route}/>
      ))}
    </div>
  );
}

function SidebarHeader() {
  return (
    <div className={cx('sidebar-header', 'app-window-drag')}/>
  );
}

function SidebarContent() {
  return (
    <div className={cx('sidebar-content')}>
      <SidebarNavigationList/>
      <SidebarQuickAccess/>
    </div>
  );
}

export function Sidebar() {
  return (
    <div className={cx('sidebar')}>
      {/* TODO: Add back SidebarBrandingLogo when required */}
      {/* <SidebarBrandingLogo/> */}
      <SidebarHeader/>
      <SidebarContent/>
    </div>
  );
}

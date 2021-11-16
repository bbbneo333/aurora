import React from 'react';
import classNames from 'classnames/bind';

import {MediaHeaderNavigationLinkComponent, RouterSwitchComponent} from '../../components';

import styles from './library.component.css';
import routes from './library.routes';

const cx = classNames.bind(styles);

export function LibraryComponent() {
  return (
    <div className={cx('library-content-browser-container')}>
      <RouterSwitchComponent routes={routes}/>
    </div>
  );
}

export function LibraryHeaderComponent() {
  return (
    <div className={cx('library-header')}>
      <div className={cx('library-header-navigation-list')}>
        {routes.map(route => route.tHeaderName && (
          <MediaHeaderNavigationLinkComponent
            key={route.path}
            tName={route.tHeaderName}
            path={route.path}
          />
        ))}
      </div>
    </div>
  );
}

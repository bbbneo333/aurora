import React from 'react';
import classNames from 'classnames/bind';

import { MediaHeaderNavigationLink, RouterSwitchComponent } from '../../components';

import styles from './library.component.css';
import routes from './library.routes';

const cx = classNames.bind(styles);

export function LibraryPage() {
  return (
    <div className={cx('library-content-browser-container')}>
      <RouterSwitchComponent routes={routes}/>
    </div>
  );
}

export function LibraryHeader() {
  return (
    <div className={cx('library-header')}>
      <div className={cx('library-header-navigation-list')}>
        {routes.map(route => route.tHeaderName && (
          <MediaHeaderNavigationLink
            key={route.path}
            tName={route.tHeaderName}
            path={route.path}
          />
        ))}
      </div>
    </div>
  );
}

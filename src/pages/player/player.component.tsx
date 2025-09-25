import React from 'react';
import classNames from 'classnames/bind';

import { MediaHeaderNavigationLink, RouterSwitchComponent } from '../../components';

import styles from './player.component.css';
import routes from './player.routes';

const cx = classNames.bind(styles);

export function PlayerPage() {
  return (
    <div className={cx('player-content-browser-container')}>
      <RouterSwitchComponent routes={routes}/>
    </div>
  );
}

export function PlayerHeader() {
  return (
    <div className={cx('player-header')}>
      <div className={cx('player-header-navigation-list')}>
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

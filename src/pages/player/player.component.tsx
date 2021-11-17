import React from 'react';
import classNames from 'classnames/bind';

import {MediaHeaderNavigationLinkComponent, RouterSwitchComponent} from '../../components';

import styles from './player.component.css';
import routes from './player.routes';

const cx = classNames.bind(styles);

export function PlayerComponent() {
  return (
    <div className={cx('player-content-browser-container')}>
      <RouterSwitchComponent routes={routes}/>
    </div>
  );
}

export function PlayerHeaderComponent() {
  return (
    <div className={cx('player-header')}>
      <div className={cx('player-header-navigation-list')}>
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

import React, { useRef } from 'react';
import classNames from 'classnames/bind';

import routes from '../app.routes';

import { BrowserNavigation, RouterSwitchComponent } from '../../components';
import { usePersistentScroll } from '../../hooks';

import styles from './browser.component.css';

const cx = classNames.bind(styles);

function BrowserLinks() {
  return (
    <RouterSwitchComponent routes={routes.header}/>
  );
}

function BrowserHeader() {
  return (
    <div className={cx('browser-header', 'app-window-drag')}>
      <BrowserNavigation/>
      <BrowserLinks/>
    </div>
  );
}

function BrowserViewport() {
  const viewportRef = useRef(null);
  usePersistentScroll({ viewportRef });

  return (
    <div ref={viewportRef} className={cx('browser-viewport', 'app-scrollable')}>
      <RouterSwitchComponent routes={routes.main}/>
    </div>
  );
}

export function Browser() {
  return (
    <div className={cx('browser')}>
      <BrowserHeader/>
      <BrowserViewport/>
    </div>
  );
}

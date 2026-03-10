import React from 'react';
import classNames from 'classnames/bind';

import routes from '../app.routes';

import { BrowserNavigation, RouterSwitchComponent } from '../../components';
import { ViewportProvider } from '../../contexts/viewport.context';

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
  return (
    <ViewportProvider className={cx('browser-viewport', 'app-scrollable')}>
      <RouterSwitchComponent routes={routes.main}/>
    </ViewportProvider>
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

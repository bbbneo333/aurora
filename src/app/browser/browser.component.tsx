import React, { useRef } from 'react';
import classNames from 'classnames/bind';

import routes from '../app.routes';

import {
  BrowserNavigation,
  BrowserScroll,
  RouterSwitchComponent,
} from '../../components';

import { AppEnums } from '../../enums';

import styles from './browser.component.css';
import AppService from '../../services/app.service';

const cx = classNames.bind(styles);

function BrowserLinks() {
  return (
    <RouterSwitchComponent routes={routes.header}/>
  );
}

function BrowserHeader() {
  return (
    <div
      className={cx('browser-header')}
      onDoubleClick={() => {
        AppService.sendSyncMessage(AppEnums.IPCCommChannels.AppToggleWindowFill);
      }}
    >
      <BrowserNavigation/>
      <BrowserLinks/>
    </div>
  );
}

function BrowserViewport() {
  const browserRef = useRef(null);

  return (
    <div ref={browserRef} className={cx('browser-viewport', 'app-scrollable')}>
      <BrowserScroll browserRef={browserRef}/>
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

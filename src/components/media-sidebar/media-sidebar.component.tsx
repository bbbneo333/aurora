import React from 'react';
import {NavLink} from 'react-router-dom';
import classNames from 'classnames/bind';

import {Routes} from '../../constants';
import {I18nService} from '../../services';

import styles from './media-sidebar.component.css';

const cx = classNames.bind(styles);

export function MediaSidebarComponent() {
  return (
    <div className={cx('media-sidebar-container')}>
      <NavLink exact to={Routes.SETTINGS} activeClassName="selected">
        {I18nService.getString('link_settings')}
      </NavLink>
    </div>
  );
}

import React from 'react';
import classNames from 'classnames/bind';

import { I18nService } from '../../services';
import { RouterLink } from '../router-link/router-link.component';

import styles from './media-header-navigation-link.component.css';

const cx = classNames.bind(styles);

export function MediaHeaderNavigationLink(props: {
  tName: string,
  path: string,
}) {
  const {
    tName,
    path,
  } = props;

  return (
    <RouterLink
      to={path}
      activeClassName={cx('active')}
      className={cx('media-header-navigation-link', 'app-nav-link')}
    >
      <span className={cx('media-header-navigation-link-label')}>
        {I18nService.getString(tName)}
      </span>
    </RouterLink>
  );
}

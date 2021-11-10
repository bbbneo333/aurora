import React from 'react';
import classNames from 'classnames/bind';

import styles from './media-content-header-user.component.css';

const cx = classNames.bind(styles);

function MediaContentUserLG() {
  return (
    <div className={cx('media-content-user')}>
      username
    </div>
  );
}

export function MediaContentHeaderUserComponent() {
  return (
    <div className={cx('media-content-header-user')}>
      <MediaContentUserLG/>
    </div>
  );
}

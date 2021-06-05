import React from 'react';
import classNames from 'classnames/bind';

import styles from './media-content-header.component.css';

const cx = classNames.bind(styles);

export function MediaContentHeaderComponent() {
  return (
    <div className={cx('media-content-header-container')}>
      Placeholder Text For Content Header
    </div>
  );
}

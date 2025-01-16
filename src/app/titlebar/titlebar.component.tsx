import React from 'react';
import classNames from 'classnames/bind';

import styles from './titlebar.component.css';

const cx = classNames.bind(styles);

export function TitleBar() {
  return (
    <div className={cx('title-bar')}/>
  );
}

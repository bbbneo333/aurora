import React from 'react';
import classNames from 'classnames/bind';

import styles from './text.component.css';

const cx = classNames.bind(styles);

export function Text(props: {
  children?: React.ReactNode;
}) {
  const { children } = props;

  return (
    <span className={cx('text')}>
      {children}
    </span>
  );
}

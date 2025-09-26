import React from 'react';
import classNames from 'classnames/bind';

import styles from './text.component.css';

const cx = classNames.bind(styles);

export type TextProps = {
  children?: React.ReactNode;
} & React.HTMLAttributes<HTMLSpanElement>;

export function Text(props: TextProps) {
  const { children, ...rest } = props;

  return (
    <span
      {...rest}
      className={cx('text')}
    >
      {children}
    </span>
  );
}

import React from 'react';
import classNames from 'classnames/bind';

import styles from './text.component.css';
import { TextProps } from './text.component';

const cx = classNames.bind(styles);

export type TextClampProps = {
  lines?: number;
} & TextProps;

export function TextClamp(props: TextClampProps) {
  const {
    children,
    lines = 3,
    style,
    ...rest
  } = props;

  return (
    <span
      {...rest}
      className={cx('text-clamp')}
      style={{
        WebkitLineClamp: lines,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

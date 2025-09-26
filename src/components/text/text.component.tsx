import React from 'react';
import classNames from 'classnames/bind';

import styles from './text.component.css';

const cx = classNames.bind(styles);

export type TextProps = {
  children?: React.ReactNode;
} & React.HTMLAttributes<HTMLSpanElement>;

export const Text = React.forwardRef<HTMLSpanElement, TextProps>((props, ref) => {
  const { children, ...rest } = props;

  return (
    <span
      {...rest}
      ref={ref}
      className={cx('text', rest.className)}
    >
      {children}
    </span>
  );
});

Text.displayName = 'Text';

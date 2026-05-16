import React from 'react';
import classNames from 'classnames/bind';

import styles from './link.component.css';

const cx = classNames.bind(styles);

export type LinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  children?: any;
  disabled?: boolean;
};

export function Link(props: LinkProps) {
  const {
    children,
    className,
    disabled = false,
    ...rest
  } = props;

  return (
    <a
      aria-disabled={disabled}
      className={cx('app-nav-link', 'link', { disabled }, className)}
      tabIndex={disabled ? -1 : 0}
      {...rest}
    >
      {children}
    </a>
  );
}

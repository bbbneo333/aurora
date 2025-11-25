import React from 'react';
import classNames from 'classnames/bind';

import styles from './link.component.css';

const cx = classNames.bind(styles);

export type LinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  children?: any;
};

export function Link(props: LinkProps) {
  const { children, className, ...rest } = props;

  return (
    <a
      className={cx('app-nav-link', 'link', className)}
      {...rest}
    >
      {children}
    </a>
  );
}

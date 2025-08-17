import React, { useEffect, useState } from 'react';
import classNames from 'classnames/bind';

import {
  NavLink,
  NavLinkProps,
  useHistory,
  useLocation,
} from 'react-router-dom';

import { AppBrowserHistory } from '../../types';

import styles from './router-link-toggle.component.css';

const cx = classNames.bind(styles);

type RouterLinkToggleProps = NavLinkProps & {
  fallbackPath?: string,
};

export function RouterLinkToggle(props: RouterLinkToggleProps) {
  const {
    className,
    activeClassName,
    children,
    to,
    fallbackPath = '/',
  } = props;

  const { pathname } = useLocation();
  const { entries } = useHistory() as AppBrowserHistory;
  const [togglePath, setTogglePath] = useState<string>(to);

  useEffect(() => {
    if (pathname === to) {
      const toLocation = entries[entries.length - 2];
      setTogglePath(toLocation ? toLocation.pathname : fallbackPath);
    } else {
      setTogglePath(to);
    }
  }, [
    to,
    fallbackPath,
    pathname,
    entries,
  ]);

  return (
    <NavLink
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
      to={togglePath}
      className={cx('router-link-toggle', className, activeClassName && {
        [activeClassName]: pathname === to,
      })}
    >
      {children}
    </NavLink>
  );
}

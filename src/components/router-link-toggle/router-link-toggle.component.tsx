import React, {useEffect, useState} from 'react';
import classNames from 'classnames';

import {
  NavLink,
  NavLinkProps,
  useHistory,
  useLocation,
} from 'react-router-dom';

import {AppBrowserHistory} from '../../types';

type RouterLinkToggleComponentProps = Pick<NavLinkProps, 'children' | 'className' | 'activeClassName' | 'to'> & {
  fallbackPath?: string,
};

export function RouterLinkToggle(props: RouterLinkToggleComponentProps) {
  const {
    className,
    activeClassName,
    children,
    to,
    fallbackPath = '/',
  } = props;

  const {pathname} = useLocation();
  const {entries} = useHistory() as AppBrowserHistory;
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
      to={togglePath}
      className={classNames(className, activeClassName && {
        [activeClassName]: pathname === to,
      })}
    >
      {children}
    </NavLink>
  );
}

import React, {useEffect, useState} from 'react';
import classNames from 'classnames';

import {
  NavLink,
  NavLinkProps,
  useHistory,
  useLocation,
} from 'react-router-dom';

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
  // important - we only have access to history.entries when using MemoryRouter
  const {entries} = useHistory() as unknown as {entries: [string]};
  const [togglePath, setTogglePath] = useState<string>(to);

  useEffect(() => {
    if (pathname === to) {
      setTogglePath(entries[entries.length - 2] || fallbackPath);
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

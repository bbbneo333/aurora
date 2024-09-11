import React from 'react';
import { NavLinkProps, NavLink, useLocation } from 'react-router-dom';

type RouterLinkProps = NavLinkProps & {};

export function RouterLink(props: RouterLinkProps) {
  const { pathname } = useLocation();

  const { to } = props;
  const navLinkUseReplace = pathname === to;

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <NavLink {...props} replace={navLinkUseReplace}/>
  );
}

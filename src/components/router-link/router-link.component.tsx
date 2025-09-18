import React from 'react';

import {
  NavLinkProps,
  NavLink,
  useLocation,
  useHistory,
} from 'react-router-dom';

import { Events } from '../../utils';

type RouterLinkProps = {} & NavLinkProps;

export function RouterLink(props: RouterLinkProps) {
  const { pathname } = useLocation();
  const history = useHistory();

  const { children, to, ...rest } = props;
  const navLinkUseReplace = pathname === to;

  return (
    <NavLink
      {...rest}
      to={to}
      replace={navLinkUseReplace}
      onClick={(e) => {
        if (Events.isModifierKey(e)) {
          // when opening link via ctrl/cmd, prevent opening link in a new tag (default)
          e.preventDefault();

          // manual navigation
          if (navLinkUseReplace) {
            history.replace(to);
          } else {
            history.push(to as string);
          }
        }

        rest.onClick?.(e);
      }}
    >
      {children}
    </NavLink>
  );
}

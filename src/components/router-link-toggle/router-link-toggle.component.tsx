import React from 'react';
import classNames from 'classnames/bind';
import { NavLinkProps, useHistory, useLocation } from 'react-router-dom';

import { RouterLink } from '../router-link/router-link.component';

import styles from './router-link-toggle.component.css';

const cx = classNames.bind(styles);

type RouterLinkToggleProps = {} & NavLinkProps;

export function RouterLinkToggle(props: RouterLinkToggleProps) {
  const {
    className,
    activeClassName,
    children,
    to,
    ...rest
  } = props;

  const { pathname } = useLocation();
  const history = useHistory();

  return (
    <RouterLink
      {...rest}
      to={to}
      className={cx('router-link-toggle', className, activeClassName && {
        [activeClassName]: pathname === to,
      })}
      onClick={(e) => {
        if (pathname === to) {
          // if user is on same path, go back to previous
          e.preventDefault();
          history.goBack();
        }
      }}
    >
      {children}
    </RouterLink>
  );
}

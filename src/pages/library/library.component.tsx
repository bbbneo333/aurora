import React from 'react';
import classNames from 'classnames/bind';

import {
  NavLink,
  Redirect,
  Route,
  Switch,
} from 'react-router-dom';

import {Routes} from '../../constants';
import {I18nService} from '../../services';

import styles from './library.component.css';
import routes, {LibraryRoute} from './library.routes';

const cx = classNames.bind(styles);

export function LibraryComponent() {
  return (
    <div className={cx('library-content-browser-container')}>
      <Switch>
        {routes.map(route => (
          <Route
            key={`route-${route.path}`}
            path={route.path}
          >
            {
              React.createElement(route.main, {
                key: `route-${route.path}`,
              })
            }
          </Route>
        ))}
        <Route exact path={Routes.Library}>
          <Redirect to={Routes.LibraryArtists}/>
        </Route>
      </Switch>
    </div>
  );
}

function LibraryHeaderNavigationLink(props: {route: LibraryRoute}) {
  const {route} = props;

  return (
    <NavLink
      to={route.path}
      activeClassName={cx('selected')}
      className={cx('library-header-navigation-item', 'app-nav-link')}
    >
      <span className={cx('library-header-navigation-item-label')}>
        {I18nService.getString(route.tName)}
      </span>
    </NavLink>
  );
}

export function LibraryHeaderComponent() {
  return (
    <div className={cx('library-header')}>
      <div className={cx('library-header-navigation-list')}>
        {routes.map(route => (
          <LibraryHeaderNavigationLink key={route.path} route={route}/>
        ))}
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import classNames from 'classnames/bind';
import { useHistory, useLocation } from 'react-router-dom';
import _ from 'lodash';

import { Icons } from '../../constants';
import { AppBrowserHistory } from '../../types';
import { Icon } from '../icon/icon.component';

import styles from './browser-navigation.component.css';

const cx = classNames.bind(styles);

enum NavigationDirection {
  Back = 'back',
  Forward = 'forward',
}

const NavigationDelta = {
  [NavigationDirection.Back]: -1,
  [NavigationDirection.Forward]: +1,
};

const NavigationIcon = {
  [NavigationDirection.Back]: Icons.NavigationBack,
  [NavigationDirection.Forward]: Icons.NavigationForward,
};

function BrowserNavigationButton(props: {
  direction: NavigationDirection,
}) {
  const {
    direction,
  } = props;

  const location = useLocation();
  const history = useHistory() as AppBrowserHistory;

  const navigationDelta = NavigationDelta[direction];
  const navigationIcon = NavigationIcon[direction];
  const [navigationIsDisabled, setNavigationIsDisabled] = useState<boolean>(true);

  useEffect(() => {
    // simply checking whether we have a history entry that we can go to on applying the
    // navigation delta (back / forward)
    // the button will be disabled if we don't any such entry
    setNavigationIsDisabled(_.isNil(history.entries[history.index + navigationDelta]));
  }, [
    location.pathname,
    history.entries,
    history.index,
    navigationDelta,
  ]);

  return (
    <button
      disabled={navigationIsDisabled}
      type="button"
      className={cx('browser-navigation-button', {
        disabled: navigationIsDisabled,
      })}
      onClick={() => {
        history.go(navigationDelta);
      }}
    >
      <Icon name={navigationIcon}/>
    </button>
  );
}

export function BrowserNavigation() {
  return (
    <div className={cx('browser-navigation')}>
      <BrowserNavigationButton direction={NavigationDirection.Back}/>
      <BrowserNavigationButton direction={NavigationDirection.Forward}/>
    </div>
  );
}

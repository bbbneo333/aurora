import React from 'react';
import classNames from 'classnames/bind';
import {useHistory} from 'react-router-dom';

import {Icons} from '../../constants';

import {Icon} from '../icon/icon.component';

import styles from './media-content-header-navigator.component.css';

const cx = classNames.bind(styles);

enum NavigationDirection {
  Left = 'left',
  Right = 'right',
}

const NavigationDelta = {
  [NavigationDirection.Left]: -1,
  [NavigationDirection.Right]: +1,
};

const NavigationIcon = {
  [NavigationDirection.Left]: Icons.NavigationBack,
  [NavigationDirection.Right]: Icons.NavigationForward,
};

function MediaContentNavigateButton(props: {
  direction: NavigationDirection
}) {
  const {
    direction,
  } = props;

  const history = useHistory();
  const navigationDelta = NavigationDelta[direction];
  const navigationIcon = NavigationIcon[direction];

  return (
    <button
      type="button"
      className={cx('media-content-navigate-button')}
      onClick={() => {
        history.go(navigationDelta);
      }}
    >
      <Icon name={navigationIcon}/>
    </button>
  );
}

export function MediaContentHeaderNavigatorComponent() {
  return (
    <div className={cx('media-content-navigator')}>
      <MediaContentNavigateButton direction={NavigationDirection.Left}/>
      <MediaContentNavigateButton direction={NavigationDirection.Right}/>
    </div>
  );
}

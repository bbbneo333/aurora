import React from 'react';
import classNames from 'classnames/bind';
import {useHistory} from 'react-router-dom';

import styles from './media-content-header-navigator.component.css';

const cx = classNames.bind(styles);

enum NavigationDirection {
  Left = 'left',
  Right = 'right',
}

const NavigationHistoryDelta = {
  [NavigationDirection.Left]: -1,
  [NavigationDirection.Right]: +1,
};

function MediaContentNavigateButton(props: {
  direction: NavigationDirection
}) {
  const {
    direction,
  } = props;

  const history = useHistory();
  const historyDelta = NavigationHistoryDelta[direction];

  return (
    <button
      type="button"
      className={cx('media-content-navigate-button')}
      onClick={() => {
        history.go(historyDelta);
      }}
    >
      <i className={`fas fa-chevron-${direction}`}/>
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

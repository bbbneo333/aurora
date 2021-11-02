import React from 'react';
import classNames from 'classnames/bind';

import styles from './media-content-header-navigator.component.css';

const cx = classNames.bind(styles);

enum MediaContentNavigateDirection {
  Left = 'left',
  Right = 'right',
}

function MediaContentNavigateButton(props: {
  direction: MediaContentNavigateDirection
}) {
  const {
    direction,
  } = props;

  return (
    <div className={cx('media-content-navigate-button')}>
      <i className={`fas fa-chevron-${direction}`}/>
    </div>
  );
}

export function MediaContentHeaderNavigatorComponent() {
  return (
    <div className={cx('media-content-navigator')}>
      <MediaContentNavigateButton direction={MediaContentNavigateDirection.Left}/>
      <MediaContentNavigateButton direction={MediaContentNavigateDirection.Right}/>
    </div>
  );
}

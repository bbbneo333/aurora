import React from 'react';
import classNames from 'classnames/bind';

import {I18nService, MediaLibraryService} from '../../services';

import styles from './media-sidebar.component.css';

const cx = classNames.bind(styles);

export function MediaSidebarComponent() {
  return (
    <div className={cx('media-sidebar-container')}>
      <button
        type="submit"
        onClick={() => MediaLibraryService.addMediaTracks()}
      >
        {I18nService.getString('action_add_tracks')}
      </button>
    </div>
  );
}

import React, { useCallback } from 'react';
import classNames from 'classnames/bind';

import { useMediaPlayback } from '../../hooks';
import { IMediaCollectionItem } from '../../interfaces';
import { Icons } from '../../constants';
import { useContextMenu } from '../../contexts';

import { Icon } from '../icon/icon.component';
import { Button } from '../button/button.component';
import { RouterLink } from '../router-link/router-link.component';

import styles from './media-collection-item.component.css';

const cx = classNames.bind(styles);

export type MediaCollectionItemProps = {
  mediaItem: IMediaCollectionItem,
  routerLink: string,
  contextMenuId?: string,
  subtitle?: string,
  disablePlayback?: boolean,
};

export function MediaCollectionItem(props: MediaCollectionItemProps) {
  const {
    mediaItem,
    routerLink,
    subtitle,
    contextMenuId,
    disablePlayback = false,
  } = props;

  const { showMenu } = useContextMenu();
  const { isMediaPlaying, handleOnPlayButtonClick, handleOnPauseButtonClick } = useMediaPlayback({
    mediaItem,
  });

  const handleOnContextMenu = useCallback((e: React.MouseEvent) => {
    if (contextMenuId) {
      showMenu({
        id: contextMenuId,
        event: e,
        props: { mediaItem },
      });
    }
  }, [
    showMenu,
    mediaItem,
    contextMenuId,
  ]);

  return (
    <div className={cx('col-12 mb-3')} onContextMenu={handleOnContextMenu}>
      <RouterLink
        exact
        to={routerLink}
        className={cx('collection-item-link', 'app-nav-link')}
      >
        <div className={cx('collection-item')}>
          <div className="row">
            <div className={cx('col-10', 'collection-item-main-column')}>
              <div className={cx('collection-item-section')}>
                {
                  isMediaPlaying
                    ? (
                      <Button
                        className={cx('collection-item-action-button')}
                        onButtonSubmit={handleOnPauseButtonClick}
                      >
                        <Icon name={Icons.MediaPause}/>
                      </Button>
                    )
                    : (
                      <Button
                        className={cx('collection-item-action-button')}
                        disabled={disablePlayback}
                        onButtonSubmit={handleOnPlayButtonClick}
                      >
                        <Icon name={Icons.MediaPlay}/>
                      </Button>
                    )
                }
              </div>
              <div className={cx('collection-item-section')}>
                <div className={cx('collection-item-info')}>
                  <div className={cx('collection-item-info-title')}>
                    {mediaItem.name}
                  </div>
                  {subtitle && (
                    <div className={cx('collection-item-info-subtitle')}>
                      {subtitle}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </RouterLink>
    </div>
  );
}

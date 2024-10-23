import React from 'react';
import classNames from 'classnames/bind';
import { isEmpty } from 'lodash';

import { Icon } from '../icon/icon.component';

import styles from './action-list.component.css';
import { MediaButtonComponent } from '../media-button/media-button.component';
import { Icons } from '../../constants';

const cx = classNames.bind(styles);

export type ActionItem = {
  id: string;
  label: string;
  icon?: string;
};

export type ActionListProps = {
  items: ActionItem[]
  onRemove?(id: string): void;
};

export const ActionList = ({ items, onRemove }: ActionListProps) => (
  <div className={cx('action-list')}>
    {isEmpty(items) && (
      <div className={cx('action-list-item', 'empty')}>
        <div className={cx('action-list-item-label')}>
          Empty
        </div>
      </div>
    )}
    {items.map(item => (
      <div className={cx('action-list-item')} key={item.id}>
        {item.icon && (
          <div className={cx('action-list-item-icon')}>
            <Icon name={item.icon}/>
          </div>
        )}
        <div className={cx('action-list-item-label')}>
          {item.label}
        </div>
        {onRemove && (
          <div className={cx('action-list-item-button')}>
            <MediaButtonComponent onButtonSubmit={() => {
              onRemove(item.id);
            }}
            >
              <Icon name={Icons.Close}/>
            </MediaButtonComponent>
          </div>
        )}
      </div>
    ))}
  </div>
);

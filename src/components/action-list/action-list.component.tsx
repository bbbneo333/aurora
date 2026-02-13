import React from 'react';
import classNames from 'classnames/bind';
import { isEmpty } from 'lodash';

import { Icon } from '../icon/icon.component';

import styles from './action-list.component.css';
import { Button } from '../button/button.component';
import { Icons } from '../../constants';

const cx = classNames.bind(styles);

export type ActionItem = {
  id: string;
  label: string | React.ReactElement;
  icon?: string;
  iconClass?: string;
  iconTooltip?: string;
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
          <div className={cx('action-list-item-icon', item.iconClass)}>
            <Icon
              name={item.icon}
              tooltip={item.iconTooltip}
            />
          </div>
        )}
        <div className={cx('action-list-item-label')}>
          {item.label}
        </div>
        {onRemove && (
          <div className={cx('action-list-item-button')}>
            <Button onButtonSubmit={() => {
              onRemove(item.id);
            }}
            >
              <Icon name={Icons.Close}/>
            </Button>
          </div>
        )}
      </div>
    ))}
  </div>
);

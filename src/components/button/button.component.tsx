import React, { DetailsHTMLAttributes, useEffect, useRef } from 'react';
import _ from 'lodash';
import classNames from 'classnames/bind';

import { SystemEnums } from '../../enums';
import { Icon } from '../icon/icon.component';

import styles from './button.component.css';

const cx = classNames.bind(styles);

// we are relying on outline script to remove outlines in case of mouse clicks
require('../../vendor/js/outline');

export type ButtonProps = {
  children?: any;
  disabled?: boolean;
  icon?: string;
  iconClassName?: string;
  onButtonSubmit?(event: Event): void;
  onButtonMove?(event: KeyboardEvent): void;
};

export function Button(props: ButtonProps & DetailsHTMLAttributes<HTMLDivElement>) {
  const {
    children,
    className,
    disabled = false,
    icon,
    iconClassName,
    onButtonSubmit,
    onButtonMove,
  } = props;

  const mediaButtonContainerProps = _.omit(props, [
    'children',
    'className',
    'icon',
    'iconClassName',
    'onButtonSubmit',
    'onButtonMove',
  ]);
  const mediaButtonContainerRef = useRef(null);

  // merge our own classnames with the provided ones
  const mediaButtonClassName = cx('button', className);

  useEffect(() => {
    // for adding listeners to button
    if ((!onButtonSubmit && !onButtonMove)
      || !mediaButtonContainerRef
      || !mediaButtonContainerRef.current) {
      return undefined;
    }

    const mediaButtonContainerElement = (mediaButtonContainerRef.current as unknown as HTMLDivElement);

    const handleOnMouseClick = (event: MouseEvent) => {
      if (onButtonSubmit && !disabled) {
        onButtonSubmit(event);
      }
      event.stopPropagation();
      event.preventDefault();
    };
    const handleOnKeyUp = (event: KeyboardEvent) => {
      switch (event.key) {
        case SystemEnums.KeyboardKeyCodes.ArrowLeft:
        case SystemEnums.KeyboardKeyCodes.ArrowRight: {
          if (onButtonMove && !disabled) {
            onButtonMove(event);
          }
          break;
        }
        case SystemEnums.KeyboardKeyCodes.Enter: {
          if (onButtonSubmit && !disabled) {
            onButtonSubmit(event);
          }
          break;
        }
        default:
        // do nothing
      }
      event.stopPropagation();
      event.preventDefault();
    };

    mediaButtonContainerElement.addEventListener('click', handleOnMouseClick);
    mediaButtonContainerElement.addEventListener('keyup', handleOnKeyUp);

    return () => {
      mediaButtonContainerElement.removeEventListener('click', handleOnMouseClick);
      mediaButtonContainerElement.removeEventListener('keyup', handleOnKeyUp);
    };
  }, [
    disabled,
    onButtonSubmit,
    onButtonMove,
    mediaButtonContainerRef,
  ]);

  return (
    <div
      className={mediaButtonClassName}
      aria-disabled={disabled}
      ref={mediaButtonContainerRef}
      role="button"
      tabIndex={0}
      {...mediaButtonContainerProps}
    >
      {icon && (
        <Icon
          className={cx('button-icon', iconClassName)}
          name={icon}
        />
      )}
      {children}
    </div>
  );
}

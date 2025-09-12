import React, {
  DetailsHTMLAttributes, useEffect, useRef, useState,
} from 'react';

import { isEmpty, omit } from 'lodash';
import classNames from 'classnames/bind';

import { SystemEnums } from '../../enums';
import { Icon } from '../icon/icon.component';

import styles from './button.component.css';
import { ButtonTooltip } from './button-tooltip.component';

const cx = classNames.bind(styles);

// we are relying on outline script to remove outlines in case of mouse clicks
require('../../vendor/js/outline');

export type ButtonProps = DetailsHTMLAttributes<HTMLDivElement> & {
  children?: any;
  disabled?: boolean;
  icon?: string;
  iconClassName?: string;
  onButtonSubmit?(event: MouseEvent | KeyboardEvent): void;
  onButtonMove?(event: KeyboardEvent): void;
  variant?: ButtonVariant | ButtonVariant[];
  tooltip?: string;
};

export type ButtonVariant = 'primary' | 'rounded' | 'outline' | 'lg';

export function Button(props: ButtonProps) {
  const {
    children,
    className,
    disabled = false,
    icon,
    iconClassName,
    onButtonSubmit,
    onButtonMove,
    variant,
    tooltip,
  } = props;

  const mediaButtonContainerProps = omit(props, [
    'children',
    'className',
    'icon',
    'iconClassName',
    'onButtonSubmit',
    'onButtonMove',
    'variant',
    'tooltip',
  ]);
  const mediaButtonContainerRef = useRef(null);

  const hasTooltip = !isEmpty(tooltip);
  const [tooltipOpen, setTooltipOpen] = useState(false);

  // merge our own classnames with the provided ones
  // variant is simply applied as a classname
  const mediaButtonClassName = cx('button', variant, className);

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
    <>
      <div
        className={mediaButtonClassName}
        aria-disabled={disabled}
        ref={mediaButtonContainerRef}
        role="button"
        tabIndex={0}
        onMouseEnter={() => setTooltipOpen(true)}
        onMouseLeave={() => setTooltipOpen(false)}
        data-dndkit-no-drag // do not allow drag events on our custom button
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
      {hasTooltip && !disabled && (
        <ButtonTooltip
          title={tooltip}
          open={tooltipOpen}
          anchorEl={mediaButtonContainerRef.current}
        />
      )}
    </>
  );
}

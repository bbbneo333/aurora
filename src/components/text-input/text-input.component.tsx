import React, {
  DetailsHTMLAttributes, useCallback, useEffect, useRef, useState,
} from 'react';
import classNames from 'classnames/bind';
import { isEmpty, omit } from 'lodash';

import styles from './text-input.component.css';
import { Icon } from '../icon/icon.component';
import { Icons } from '../../constants';
import { Button } from '../button/button.component';

const cx = classNames.bind(styles);

export type TextInputProps = {
  clearable?: boolean;
  focus?: boolean;
  icon?: string;
  iconClassName?: string;
  placeholder?: string;
  value?: string;
  onInputValue?: (value: string) => void;
};

export function TextInput(props: TextInputProps & DetailsHTMLAttributes<HTMLInputElement> = {}) {
  const {
    className,
    clearable,
    focus,
    icon,
    iconClassName,
    value = '',
    onInputValue,
  } = props;

  const [textInputValue, setTextInputValue] = useState<string>(value);
  const inputRef = useRef<HTMLInputElement>(null);

  const textInputElementProps = omit(props, [
    'className',
    'clearable',
    'focus',
    'icon',
    'iconClassName',
    'value',
    'onInputValue',
  ]);

  const onTextInputChange = useCallback((e) => {
    const { value: v } = e.target as HTMLInputElement;
    setTextInputValue(v);
  }, []);

  useEffect(() => {
    if (onInputValue) {
      onInputValue(textInputValue);
    }
  }, [
    onInputValue,
    textInputValue,
  ]);

  useEffect(() => {
    if (focus) {
      inputRef.current?.focus();
    } else {
      inputRef.current?.blur();
    }
  }, [
    focus,
  ]);

  return (
    <div className={cx(className, 'text-input-container')}>
      <div className={cx('text-input-overlay')}>
        {icon && (
          <Icon
            className={cx(iconClassName, 'text-input-icon')}
            name={icon}
          />
        )}
        {clearable && !isEmpty(textInputValue) && (
          <Button
            className={cx('text-input-clear-button')}
            onButtonSubmit={() => setTextInputValue('')}
          >
            <Icon
              className={cx('text-input-icon')}
              name={Icons.Close}
            />
          </Button>
        )}
      </div>
      <input
        ref={inputRef}
        className={cx('text-input')}
        type="text"
        onChange={onTextInputChange}
        value={textInputValue}
        {...textInputElementProps}
      />
    </div>
  );
}

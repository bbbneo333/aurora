import React, {
  DetailsHTMLAttributes, useCallback, useEffect, useState,
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
  icon?: string;
  placeholder?: string;
  onInputValue?: (value: string) => void;
};

export function TextInput(props: TextInputProps & DetailsHTMLAttributes<HTMLInputElement> = {}) {
  const {
    clearable,
    icon,
    onInputValue,
  } = props;

  const textInputElementProps = omit(props, [
    'clearable',
    'icon',
    'onInputValue',
  ]);

  const [textInputValue, setTextInputValue] = useState<string>('');

  const onTextInputChange = useCallback((e) => {
    const { value } = e.target as HTMLInputElement;
    setTextInputValue(value);
  }, []);

  useEffect(() => {
    if (onInputValue) {
      onInputValue(textInputValue);
    }
  }, [
    onInputValue,
    textInputValue,
  ]);

  return (
    <div className={cx('text-input-container')}>
      <div className={cx('text-input-overlay')}>
        {icon && (
          <Icon
            className={cx('text-input-icon')}
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
        className={cx('text-input')}
        type="text"
        onChange={onTextInputChange}
        value={textInputValue}
        {...textInputElementProps}
      />
    </div>
  );
}

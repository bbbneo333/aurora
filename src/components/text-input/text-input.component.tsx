import React from 'react';
import classNames from 'classnames/bind';
import { isEmpty } from 'lodash';

import styles from './text-input.component.css';
import { Icon } from '../icon/icon.component';
import { Icons } from '../../constants';
import { Button } from '../button/button.component';

const cx = classNames.bind(styles);

export type TextInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  clearable?: boolean;
  focus?: boolean;
  icon?: string;
  iconClassName?: string;
  placeholder?: string;
  value?: string;
  onInputValue?: (value: string) => void;
};

export function TextInput(props: TextInputProps = {}) {
  const {
    className,
    clearable,
    focus,
    icon,
    iconClassName,
    value = '',
    onInputValue,
    ...rest
  } = props;

  const [textInputValue, setTextInputValue] = React.useState<string>(value);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const onTextInputChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTextInputValue(e.target.value);
  }, []);

  React.useEffect(() => {
    if (onInputValue) {
      onInputValue(textInputValue);
    }
  }, [
    onInputValue,
    textInputValue,
  ]);

  React.useEffect(() => {
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
        {...rest}
      />
    </div>
  );
}

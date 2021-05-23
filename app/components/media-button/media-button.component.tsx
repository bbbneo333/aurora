import React, {useEffect, useRef} from 'react';
import classNames from 'classnames/bind';
import {SystemEnums} from '../../enums';

const cx = classNames.bind({});

// we are relying on outline script to remove outlines in case of mouse clicks
require('../../vendor/js/outline');

export function MediaButtonComponent(props: {
  buttonClassName?: string,
  children?: any,
  onSubmit?(): void,
}) {
  const {
    buttonClassName,
    children,
    onSubmit,
  } = props;

  const mediaButtonContainerRef = useRef(null);

  useEffect(() => {
    // for adding listeners to button
    if (!onSubmit
      || !mediaButtonContainerRef
      || !mediaButtonContainerRef.current) {
      return undefined;
    }

    const mediaButtonContainerElement = (mediaButtonContainerRef.current as unknown as HTMLDivElement);

    const handleOnMouseClick = (event: MouseEvent) => {
      onSubmit();
      event.stopPropagation();
      event.preventDefault();
    };
    const handleOnKeyUp = (event: KeyboardEvent) => {
      if (event.key === SystemEnums.KeyboardKeyCodes.Enter) {
        onSubmit();
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
    onSubmit,
    mediaButtonContainerRef,
  ]);

  return (
    <div
      ref={mediaButtonContainerRef}
      role="button"
      tabIndex={0}
      className={cx(buttonClassName)}
    >
      {children}
    </div>
  );
}

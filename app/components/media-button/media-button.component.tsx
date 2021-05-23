import React, {DetailsHTMLAttributes, useEffect, useRef} from 'react';
import * as _ from 'lodash';

import {SystemEnums} from '../../enums';

// we are relying on outline script to remove outlines in case of mouse clicks
require('../../vendor/js/outline');

export type MediaButtonComponentProps = {
  children?: any,
  onButtonSubmit?(event: Event): void,
  onButtonMove?(event: KeyboardEvent): void,
};

export function MediaButtonComponent(props: MediaButtonComponentProps & DetailsHTMLAttributes<HTMLDivElement>) {
  const {
    children,
    onButtonSubmit,
    onButtonMove,
  } = props;

  const mediaButtonContainerProps = _.omit(props, [
    'children',
    'onButtonSubmit',
    'onButtonMove',
  ]);
  const mediaButtonContainerRef = useRef(null);

  useEffect(() => {
    // for adding listeners to button
    if ((!onButtonSubmit && !onButtonMove)
      || !mediaButtonContainerRef
      || !mediaButtonContainerRef.current) {
      return undefined;
    }

    const mediaButtonContainerElement = (mediaButtonContainerRef.current as unknown as HTMLDivElement);

    const handleOnMouseClick = (event: MouseEvent) => {
      if (onButtonSubmit) {
        onButtonSubmit(event);
      }
      event.stopPropagation();
      event.preventDefault();
    };
    const handleOnKeyUp = (event: KeyboardEvent) => {
      switch (event.key) {
        case SystemEnums.KeyboardKeyCodes.ArrowLeft:
        case SystemEnums.KeyboardKeyCodes.ArrowRight: {
          if (onButtonMove) {
            onButtonMove(event);
          }
          break;
        }
        case SystemEnums.KeyboardKeyCodes.Enter: {
          if (onButtonSubmit) {
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
    onButtonSubmit,
    onButtonMove,
    mediaButtonContainerRef,
  ]);

  return (
    <div
      ref={mediaButtonContainerRef}
      role="button"
      tabIndex={0}
      {...mediaButtonContainerProps}
    >
      {children}
    </div>
  );
}

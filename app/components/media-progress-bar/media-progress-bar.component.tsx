import React, {
  MouseEvent as ReactMouseEvent,
  useCallback,
  useEffect,
  useReducer,
  useRef,
} from 'react';

import classNames from 'classnames/bind';

import styles from './media-progress-bar.component.scss';

const debug = require('debug')('app:component:media_progress_bar_component');

const cx = classNames.bind(styles);

type MediaProgressBarComponentProps = {
  value?: number;
  maxValue?: number;
  disabled?: boolean;
  progressContainerClassName?: string;
  progressBarClassName?: string;
  progressHandlerClassName?: string;
  onDragUpdate?(value: number): void | number;
  onDragEnd?(value: number): void | number;
};

type MediaProgressState = {
  mediaProgressCurrentValue: number,
  mediaProgressMaxValue: number,
  mediaProgressHandlerIsDragging: boolean;
  mediaProgressHandlerDragPercent: undefined | number;
  mediaProgressHandlerDragEndPayload: undefined | {
    mediaProgressDragEndValue: number,
    mediaProgressHandlerDragEndPercent: undefined | number;
  };
};

enum MediaProgressStateActionType {
  MediaProgressUpdate = 'mediaProgress/update',
  MediaProgressStartDrag = 'mediaProgress/startDrag',
  MediaProgressUpdateDrag = 'mediaProgress/updateDrag',
  MediaProgressEndDrag = 'mediaProgress/endDrag',
  MediaProgressJump = 'mediaProgress/jump',
  MediaResetDragEndPayload = 'mediaProgress/resetDragEndPayload',
}

type MediaProgressStateAction = {
  type: MediaProgressStateActionType,
  data?: any;
};

function getPercentFromValue(mediaProgressValue: number, mediaProgressMaxThreshold: number): number {
  return (mediaProgressValue / mediaProgressMaxThreshold) * 100;
}

function getValueFromPercent(mediaProgressPercent: number, mediaProgressMaxThreshold: number): number {
  const value = (mediaProgressPercent / 100) * mediaProgressMaxThreshold;
  return Number(value.toFixed());
}

function getPercentFromPosition(mediaProgressPosition: number, mediaProgressContainerElement: HTMLDivElement, mediaProgressMaxThreshold: number): number {
  const mediaProgressContainerPositionStartX = mediaProgressContainerElement.getBoundingClientRect().left;
  const mediaProgressContainerPositionEndX = mediaProgressContainerElement.getBoundingClientRect().right;

  let mediaProgressPercent: number;

  if (mediaProgressPosition < mediaProgressContainerPositionStartX) {
    // drag is out of bounds from the start
    mediaProgressPercent = 0;
  } else if (mediaProgressPosition > mediaProgressContainerPositionEndX) {
    // drag is out of bounds from the end
    mediaProgressPercent = 100;
  } else {
    debug('getPercentFromPosition - media progress position - (x) %f', mediaProgressPosition);
    debug('getPercentFromPosition - media progress container position - (start) %f (end) %f', mediaProgressContainerPositionStartX, mediaProgressContainerPositionEndX);

    const mediaProgressOffset = mediaProgressPosition - mediaProgressContainerPositionStartX;
    const mediaProgressContainerWidth = mediaProgressContainerPositionEndX - mediaProgressContainerPositionStartX;

    const mediaProgressContainerBreakpoint = mediaProgressContainerWidth / mediaProgressMaxThreshold;
    const mediaProgressNearBreakpoint = Math.ceil((mediaProgressOffset / mediaProgressContainerBreakpoint)) * mediaProgressContainerBreakpoint;

    mediaProgressPercent = getPercentFromValue(mediaProgressNearBreakpoint, mediaProgressContainerWidth);
  }

  return mediaProgressPercent;
}

function mediaProgressStateReducer(state: MediaProgressState, action: MediaProgressStateAction): MediaProgressState {
  switch (action.type) {
    case MediaProgressStateActionType.MediaProgressUpdate: {
      const {
        mediaProgress,
        mediaProgressMaxValue,
      } = action.data;

      return {
        ...state,
        mediaProgressCurrentValue: mediaProgress,
        mediaProgressMaxValue: mediaProgressMaxValue !== undefined
          ? mediaProgressMaxValue
          : state.mediaProgressMaxValue,
      };
    }
    case MediaProgressStateActionType.MediaProgressStartDrag: {
      return {
        ...state,
        mediaProgressHandlerIsDragging: true,
        mediaProgressHandlerDragPercent: undefined,
        mediaProgressHandlerDragEndPayload: undefined,
      };
    }
    case MediaProgressStateActionType.MediaProgressUpdateDrag: {
      const {
        eventPositionX,
        mediaProgressBarContainerRef,
        mediaProgressMaxValue,
      } = action.data;

      // if any of the required references is missing, do nothing, this is just for safety and won't likely happen
      if (!mediaProgressBarContainerRef || !mediaProgressBarContainerRef.current) {
        return state;
      }

      const mediaProgressContainerElement = (mediaProgressBarContainerRef.current as unknown as HTMLDivElement);
      const mediaProgressHandlerDragPercent = getPercentFromPosition(eventPositionX, mediaProgressContainerElement, mediaProgressMaxValue);

      // we won't be doing anything in case the computed progress value is same
      if (state.mediaProgressHandlerDragPercent === mediaProgressHandlerDragPercent) {
        return state;
      }

      return {
        ...state,
        mediaProgressHandlerDragPercent,
        mediaProgressHandlerDragEndPayload: undefined,
      };
    }
    case MediaProgressStateActionType.MediaProgressEndDrag: {
      return {
        ...state,
        mediaProgressHandlerIsDragging: false,
        mediaProgressHandlerDragPercent: undefined,
        mediaProgressHandlerDragEndPayload: {
          mediaProgressDragEndValue: state.mediaProgressCurrentValue,
          mediaProgressHandlerDragEndPercent: state.mediaProgressHandlerDragPercent,
        },
      };
    }
    case MediaProgressStateActionType.MediaProgressJump: {
      const {
        eventPositionX,
        mediaProgressBarContainerRef,
        mediaProgressMaxValue,
      } = action.data;

      // if any of the required references is missing, do nothing, this is just for safety and won't likely happen
      if (!mediaProgressBarContainerRef || !mediaProgressBarContainerRef.current) {
        return state;
      }

      const mediaProgressContainerElement = (mediaProgressBarContainerRef.current as unknown as HTMLDivElement);
      const mediaProgressHandlerDragPercent = getPercentFromPosition(eventPositionX, mediaProgressContainerElement, mediaProgressMaxValue);

      // we won't be doing anything in case the computed progress value is same
      if (state.mediaProgressHandlerDragPercent === mediaProgressHandlerDragPercent) {
        return state;
      }

      return {
        ...state,
        mediaProgressHandlerIsDragging: false,
        mediaProgressHandlerDragPercent: undefined,
        mediaProgressHandlerDragEndPayload: {
          mediaProgressDragEndValue: state.mediaProgressCurrentValue,
          mediaProgressHandlerDragEndPercent: mediaProgressHandlerDragPercent,
        },
      };
    }
    case MediaProgressStateActionType.MediaResetDragEndPayload: {
      return {
        ...state,
        mediaProgressHandlerDragEndPayload: undefined,
      };
    }
    default:
      return state;
  }
}

export function MediaProgressBarComponent(props: MediaProgressBarComponentProps = {}) {
  const {
    value = 0,
    maxValue = 100,
    disabled = false,
    progressContainerClassName,
    progressBarClassName,
    progressHandlerClassName,
    onDragUpdate,
    onDragEnd,
  } = props;

  const mediaProgressBarContainerRef = useRef(null);

  const [{
    mediaProgressCurrentValue,
    mediaProgressMaxValue,
    mediaProgressHandlerIsDragging,
    mediaProgressHandlerDragPercent,
    mediaProgressHandlerDragEndPayload,
  }, mediaProgressStateDispatch] = useReducer(mediaProgressStateReducer, {
    mediaProgressCurrentValue: value,
    mediaProgressMaxValue: maxValue,
    mediaProgressHandlerIsDragging: false,
    mediaProgressHandlerDragPercent: undefined,
    mediaProgressHandlerDragEndPayload: undefined,
  });

  const handleOnProgressHandlerMouseDown = useCallback((e: ReactMouseEvent) => {
    // only when:
    // - progress bar is enabled
    // - left mouse button
    if (disabled || e.button !== 0) {
      return;
    }

    debug('onMouseDown - event coords - (x) %f (y) %f', e.pageX, e.pageY);

    mediaProgressStateDispatch({
      type: MediaProgressStateActionType.MediaProgressStartDrag,
    });

    e.stopPropagation();
    e.preventDefault();
  }, [
    disabled,
  ]);

  const handleOnProgressContainerMouseClick = useCallback((e: ReactMouseEvent) => {
    // only when progress bar is enabled
    if (disabled) {
      return;
    }

    debug('onMouseClick - event coords - (x) %f (y) %f', e.pageX, e.pageY);

    mediaProgressStateDispatch({
      type: MediaProgressStateActionType.MediaProgressJump,
      data: {
        eventPositionX: e.pageX,
        mediaProgressBarContainerRef,
        mediaProgressMaxValue,
      },
    });

    e.stopPropagation();
    e.preventDefault();
  }, [
    disabled,
    mediaProgressMaxValue,
  ]);

  useEffect(() => {
    // as we are using a prop value to set a state, any change in the prop won't trigger the re-render
    // in order to force re-render, useEffect is set to listen on prop value and triggers the re-render via setting the state
    // @see - https://stackoverflow.com/questions/54865764/react-usestate-does-not-reload-state-from-props
    mediaProgressStateDispatch({
      type: MediaProgressStateActionType.MediaProgressUpdate,
      data: {
        mediaProgress: value,
        mediaProgressMaxValue: maxValue,
      },
    });
  }, [
    value,
    maxValue,
  ]);

  useEffect(() => {
    // for ending the drag if progress bar was disabled during an active drag
    if (disabled && mediaProgressHandlerIsDragging) {
      debug('ending drag due to disabled during an active drag');

      mediaProgressStateDispatch({
        type: MediaProgressStateActionType.MediaProgressEndDrag,
      });
    }
  }, [
    disabled,
    mediaProgressHandlerIsDragging,
  ]);

  useEffect(() => {
    // for adding / removing handlers whenever we enter / exit drag state
    const handleOnDocumentMouseMove = (e: MouseEvent) => {
      // only when progress bar is enabled
      if (disabled) {
        return;
      }

      debug('onMouseMove - dragging? - %s, event coords - (x) %f (y) %f', mediaProgressHandlerIsDragging, e.pageX, e.pageY);

      mediaProgressStateDispatch({
        type: MediaProgressStateActionType.MediaProgressUpdateDrag,
        data: {
          eventPositionX: e.pageX,
          mediaProgressBarContainerRef,
          mediaProgressMaxValue,
        },
      });

      e.stopPropagation();
      e.preventDefault();
    };
    const handleOnDocumentMouseUp = (e: MouseEvent) => {
      // only when progress bar is enabled
      if (disabled) {
        return;
      }

      debug('onMouseUp - dragging? - %s, event coords - (x) %f (y) %f', mediaProgressHandlerIsDragging, e.pageX, e.pageY);

      mediaProgressStateDispatch({
        type: MediaProgressStateActionType.MediaProgressEndDrag,
      });

      e.stopPropagation();
      e.preventDefault();
    };

    if (mediaProgressHandlerIsDragging) {
      debug('registering handlers to document on drag start');
      document.addEventListener('mousemove', handleOnDocumentMouseMove);
      document.addEventListener('mouseup', handleOnDocumentMouseUp);
    } else {
      debug('de-registering handlers from document on drag end');
      document.removeEventListener('mousemove', handleOnDocumentMouseMove);
      document.removeEventListener('mouseup', handleOnDocumentMouseUp);
    }

    return () => {
      debug('de-registering handlers from document on destroy');
      document.removeEventListener('mousemove', handleOnDocumentMouseMove);
      document.removeEventListener('mouseup', handleOnDocumentMouseUp);
    };
  }, [
    disabled,
    mediaProgressMaxValue,
    mediaProgressHandlerIsDragging,
  ]);

  useEffect(() => {
    // for reporting drag updates whenever we are in drag state
    if (!onDragUpdate
      || !mediaProgressHandlerIsDragging
      || mediaProgressHandlerDragPercent === undefined) {
      return;
    }

    const mediaProgressValue = getValueFromPercent(mediaProgressHandlerDragPercent, mediaProgressMaxValue);

    debug('reporting onDragUpdate - %o', {
      mediaProgressHandlerDragPercent,
      mediaProgressValue,
    });

    // instead of relying on the next render cycle to update the progress bar (via prop.value)
    // onDragUpdate can also return the value that needs to be set for the progress bar here right away
    // this will prevent the jarring progress update when progress needs to be shifted backwards
    const mediaProgressUpdated = onDragUpdate(mediaProgressValue);

    if (mediaProgressUpdated !== undefined) {
      mediaProgressStateDispatch({
        type: MediaProgressStateActionType.MediaProgressUpdate,
        data: {
          mediaProgress: mediaProgressUpdated,
        },
      });
    }
  }, [
    onDragUpdate,
    mediaProgressMaxValue,
    mediaProgressHandlerIsDragging,
    mediaProgressHandlerDragPercent,
  ]);

  useEffect(() => {
    // for reporting drag end whenever drag is ended
    if (!onDragEnd || !mediaProgressHandlerDragEndPayload) {
      return;
    }

    const {
      mediaProgressDragEndValue,
      mediaProgressHandlerDragEndPercent,
    } = mediaProgressHandlerDragEndPayload;

    // on the event of drag end, there can be a case where no drag (mouse movement) actually occurred since the drag was started
    // in such cases, mediaProgressHandlerDragPosition will remain undefined and we will be reporting with the value with which the drag originally ended
    const mediaProgressValue = mediaProgressHandlerDragEndPercent !== undefined
      ? getValueFromPercent(mediaProgressHandlerDragEndPercent, mediaProgressMaxValue)
      : mediaProgressDragEndValue;

    debug('reporting onDragEnd - %o', {
      mediaProgressHandlerDragPercent: mediaProgressHandlerDragEndPercent,
      mediaProgressValue,
    });

    // instead of relying on the next render cycle to update the progress bar (via prop.value)
    // onDragEnd can also return the value that needs to be set for the progress bar here right away
    // this will prevent the jarring progress update when progress needs to be shifted backwards
    const mediaProgressUpdated = onDragEnd(mediaProgressValue);

    if (mediaProgressUpdated !== undefined) {
      mediaProgressStateDispatch({
        type: MediaProgressStateActionType.MediaProgressUpdate,
        data: {
          mediaProgress: mediaProgressUpdated,
        },
      });
    }

    // reset drag end payload in order to not pick it up accidentally on next render cycle
    mediaProgressStateDispatch({
      type: MediaProgressStateActionType.MediaResetDragEndPayload,
    });
  }, [
    onDragEnd,
    mediaProgressMaxValue,
    mediaProgressHandlerDragEndPayload,
  ]);

  const mediaProgressPercentage = `${mediaProgressHandlerDragPercent !== undefined
    ? mediaProgressHandlerDragPercent
    : getPercentFromValue(mediaProgressCurrentValue, mediaProgressMaxValue)}%`;

  return (
    <div className={cx('media-progress-container', progressContainerClassName, {
      disabled,
      dragging: mediaProgressHandlerIsDragging,
    })}
    >
      {/* TODO: Fix eslint warnings */}
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions,jsx-a11y/click-events-have-key-events */}
      <div
        ref={mediaProgressBarContainerRef}
        className={cx('media-progress-bar-container')}
        onClick={handleOnProgressContainerMouseClick}
      >
        <div
          style={{
            width: mediaProgressPercentage,
          }}
          className={cx('media-progress-bar', progressBarClassName)}
        />
      </div>
      {/* TODO: Fix eslint warnings */}
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
      <div
        style={{
          left: mediaProgressPercentage,
        }}
        className={cx('media-progress-handler', progressHandlerClassName)}
        onMouseDown={handleOnProgressHandlerMouseDown}
      />
    </div>
  );
}

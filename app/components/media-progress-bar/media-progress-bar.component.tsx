import React, {
  MouseEvent as ReactMouseEvent,
  useEffect,
  useReducer,
  useRef,
} from 'react';

import classNames from 'classnames/bind';

import styles from './media-progress-bar.component.css';

const debug = require('debug')('app:component:media_progress_bar_component');

const cx = classNames.bind(styles);

type MediaProgressBarComponentProps = {
  value?: number;
  maxValue?: number;
  progressContainerClassName?: string;
  progressBarClassName?: string;
  progressHandlerClassName?: string;
  onDragStart?(value: number): void;
  onDragUpdate?(value: number): void;
  onDragEnd?(value: number): void | number;
};

type MediaProgressState = {
  mediaProgressCurrentValue: number,
  mediaProgressHandlerIsDragging: boolean;
  mediaProgressHandlerDragPercent: undefined | number;
};

enum MediaProgressStateActionType {
  MediaProgressUpdate = 'mediaProgress/update',
  MediaProgressStartDrag = 'mediaProgress/startDrag',
  MediaProgressUpdateDrag = 'mediaProgress/updateDrag',
  MediaProgressEndDrag = 'mediaProgress/endDrag',
}

type MediaProgressStateAction = {
  type: MediaProgressStateActionType,
  data?: any;
};

function getPercentFromValue(value: number, maxValue: number): number {
  return (value / maxValue) * 100;
}

function getValueFromPercent(percent: number, maxValue: number): number {
  const value = (percent / 100) * maxValue;
  return Number(value.toFixed());
}

function mediaProgressStateReducer(state: MediaProgressState, action: MediaProgressStateAction): MediaProgressState {
  switch (action.type) {
    case MediaProgressStateActionType.MediaProgressUpdate: {
      const {
        mediaProgress,
      } = action.data;

      return {
        ...state,
        mediaProgressCurrentValue: mediaProgress,
      };
    }
    case MediaProgressStateActionType.MediaProgressStartDrag: {
      const {
        onDragStart,
      } = action.data;

      if (onDragStart) {
        onDragStart(state.mediaProgressCurrentValue);
      }

      return {
        ...state,
        mediaProgressHandlerIsDragging: true,
        mediaProgressHandlerDragPercent: undefined,
      };
    }
    case MediaProgressStateActionType.MediaProgressUpdateDrag: {
      const {
        eventPositionX,
        mediaProgressBarContainerRef,
        maxValue,
        onDragUpdate,
      } = action.data;

      // if any of the required references is missing, do nothing, this is just for safety and won't likely happen
      if (!mediaProgressBarContainerRef || !mediaProgressBarContainerRef.current) {
        return state;
      }

      const mediaProgressContainerElement = (mediaProgressBarContainerRef.current as unknown as HTMLDivElement);

      const mediaProgressContainerOffsetStartX = mediaProgressContainerElement.getBoundingClientRect().left;
      const mediaProgressContainerOffsetEndX = mediaProgressContainerElement.getBoundingClientRect().right;

      let eventTraversalPercent: number;

      if (eventPositionX < mediaProgressContainerOffsetStartX) {
        // drag is out of bounds from the start
        eventTraversalPercent = 0;
      } else if (eventPositionX > mediaProgressContainerOffsetEndX) {
        // drag is out of bounds from the end
        eventTraversalPercent = 100;
      } else {
        debug('state action - %s, event position - (x) %f', action.type, eventPositionX);
        debug('state action - %s, media progress container offset - (start) %f (end) %f', action.type, mediaProgressContainerOffsetStartX, mediaProgressContainerOffsetEndX);

        const eventOffsetToMediaProgressContainer = eventPositionX - mediaProgressContainerOffsetStartX;
        const mediaProgressContainerWidth = mediaProgressContainerOffsetEndX - mediaProgressContainerOffsetStartX;

        const mediaProgressContainerBreakpoint = mediaProgressContainerWidth / maxValue;
        const eventOffsetToNearestBreakpoint = Math.ceil((eventOffsetToMediaProgressContainer / mediaProgressContainerBreakpoint)) * mediaProgressContainerBreakpoint;

        eventTraversalPercent = getPercentFromValue(eventOffsetToNearestBreakpoint, mediaProgressContainerWidth);
      }

      // we won't be doing anything in case the computed progress value is same
      if (state.mediaProgressHandlerDragPercent === eventTraversalPercent) {
        return state;
      }

      if (onDragUpdate) {
        const mediaProgressValue = getValueFromPercent(eventTraversalPercent, maxValue);

        debug('state action - %s, reporting onDragUpdate - %o', action.type, {
          dragTraversalPercent: state.mediaProgressHandlerDragPercent,
          eventTraversalPercent,
          mediaProgressValue,
        });

        onDragUpdate(mediaProgressValue);
      }

      return {
        ...state,
        mediaProgressHandlerDragPercent: eventTraversalPercent,
      };
    }
    case MediaProgressStateActionType.MediaProgressEndDrag: {
      const {
        maxValue,
        onDragEnd,
      } = action.data;

      let mediaProgressUpdated;

      if (onDragEnd) {
        // on the event of drag end, there can be a case where no drag (mouse movement) actually occurred since the drag was started
        // in such cases, mediaProgressHandlerDragPosition will remain undefined and we will be reporting with the current value of the progress
        const mediaProgressValue = state.mediaProgressHandlerDragPercent !== undefined
          ? getValueFromPercent(state.mediaProgressHandlerDragPercent, maxValue)
          : state.mediaProgressCurrentValue;

        // instead of relying on the next render cycle to update the progress bar (via prop.value)
        // onDragEnd can also return the value that needs to be set for the progress bar here right away
        // this will prevent the jarring progress update when progress needs to be shifted backwards
        mediaProgressUpdated = onDragEnd(mediaProgressValue);
      }

      return {
        ...state,
        mediaProgressCurrentValue: mediaProgressUpdated !== undefined
          ? mediaProgressUpdated
          : state.mediaProgressCurrentValue,
        mediaProgressHandlerIsDragging: false,
        mediaProgressHandlerDragPercent: undefined,
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
    progressContainerClassName,
    progressBarClassName,
    progressHandlerClassName,
    onDragStart,
    onDragUpdate,
    onDragEnd,
  } = props;

  const mediaProgressBarContainerRef = useRef(null);

  const [{
    mediaProgressCurrentValue,
    mediaProgressHandlerIsDragging,
    mediaProgressHandlerDragPercent,
  }, mediaProgressStateDispatch] = useReducer(mediaProgressStateReducer, {
    mediaProgressCurrentValue: value,
    mediaProgressHandlerIsDragging: false,
    mediaProgressHandlerDragPercent: undefined,
  });

  const handleOnProgressHandlerMouseDown = (e: ReactMouseEvent) => {
    // only left mouse button
    if (e.button !== 0) return;
    debug('onMouseDown - dragging? - %s, event coords - (x) %f (y)', mediaProgressHandlerIsDragging, e.pageX, e.pageY);

    mediaProgressStateDispatch({
      type: MediaProgressStateActionType.MediaProgressStartDrag,
      data: {
        onDragStart,
      },
    });

    e.stopPropagation();
    e.preventDefault();
  };

  useEffect(() => {
    const handleOnDocumentMouseMove = (e: MouseEvent) => {
      debug('onMouseMove - dragging? - %s, event coords - (x) %f (y) %f', mediaProgressHandlerIsDragging, e.pageX, e.pageY);

      mediaProgressStateDispatch({
        type: MediaProgressStateActionType.MediaProgressUpdateDrag,
        data: {
          eventPositionX: e.pageX,
          mediaProgressBarContainerRef,
          maxValue,
          onDragUpdate,
        },
      });

      e.stopPropagation();
      e.preventDefault();
    };
    const handleOnDocumentMouseUp = (e: MouseEvent) => {
      debug('onMouseUp - dragging? - %s, event coords - (x) %f (y)', mediaProgressHandlerIsDragging, e.pageX, e.pageY);

      mediaProgressStateDispatch({
        type: MediaProgressStateActionType.MediaProgressEndDrag,
        data: {
          maxValue,
          onDragEnd,
        },
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
    maxValue,
    onDragUpdate,
    onDragEnd,
    mediaProgressHandlerIsDragging,
    mediaProgressBarContainerRef,
  ]);

  useEffect(() => {
    // as we are using a prop value to set a state, any change in the prop won't trigger the re-render
    // in order to force re-render, useEffect is set to listen on prop value and triggers the re-render via setting the state (setMediaProgressCurrentValue)
    // @see - https://stackoverflow.com/questions/54865764/react-usestate-does-not-reload-state-from-props
    mediaProgressStateDispatch({
      type: MediaProgressStateActionType.MediaProgressUpdate,
      data: {
        mediaProgress: value,
      },
    });
  }, [value]);

  const mediaProgressPercentage = `${mediaProgressHandlerDragPercent !== undefined
    ? mediaProgressHandlerDragPercent
    : getPercentFromValue(mediaProgressCurrentValue, maxValue)}%`;

  return (
    <div className={cx('media-progress-container', progressContainerClassName)}>
      <div
        ref={mediaProgressBarContainerRef}
        className={cx('media-progress-bar-container')}
      >
        <div
          style={{
            width: mediaProgressPercentage,
          }}
          className={cx('media-progress-bar', progressBarClassName, {
            'media-progress-bar-dragging': mediaProgressHandlerIsDragging,
          })}
        />
      </div>
      {/* TODO: Fix eslint warnings */}
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
      <div
        style={{
          left: mediaProgressPercentage,
        }}
        className={cx('media-progress-handler', progressHandlerClassName, {
          'media-progress-handler-dragging': mediaProgressHandlerIsDragging,
        })}
        onMouseDown={handleOnProgressHandlerMouseDown}
      />
    </div>
  );
}

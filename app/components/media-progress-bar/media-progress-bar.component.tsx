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
  mediaProgressHandlerDragPosition: undefined | number;
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

function getPositionFromValue(value: number, maxValue: number): number {
  const position = (value / maxValue) * 100;
  return Number(position.toFixed(2));
}

function getValueFromPosition(position: number, maxValue: number): number {
  const value = (position / 100) * maxValue;
  return Number(value.toFixed(2));
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
        mediaProgressHandlerDragPosition: undefined,
      };
    }
    case MediaProgressStateActionType.MediaProgressUpdateDrag: {
      const {
        eventPositionX,
        mediaProgressBarContainerRef,
        mediaProgressHandlerRef,
        maxValue,
        onDragUpdate,
      } = action.data;

      // if any of the required references is missing, do nothing, this is just for safety and won't likely happen
      if (!mediaProgressBarContainerRef
        || !mediaProgressBarContainerRef.current
        || !mediaProgressHandlerRef
        || !mediaProgressHandlerRef.current) {
        return state;
      }

      const mediaProgressContainerElement = (mediaProgressBarContainerRef.current as unknown as HTMLDivElement);
      const mediaProgressHandlerElement = (mediaProgressHandlerRef.current as unknown as HTMLDivElement);

      const mediaProgressContainerOffsetStartX = mediaProgressContainerElement.getBoundingClientRect().left;
      const mediaProgressContainerOffsetEndX = mediaProgressContainerElement.getBoundingClientRect().right;
      const mediaProgressHandlerOffsetX = mediaProgressHandlerElement.getBoundingClientRect().left;

      let eventTraversalPosition;

      if (eventPositionX < mediaProgressContainerOffsetStartX) {
        // drag is out of bounds from the start
        eventTraversalPosition = 0;
      } else if (eventPositionX > mediaProgressContainerOffsetEndX) {
        // drag is out of bounds from the end
        eventTraversalPosition = 100;
      } else {
        debug('state action - %s, media progress container offset - (start) %f (end) %f', action.type, mediaProgressContainerOffsetStartX, mediaProgressContainerOffsetEndX);
        debug('state action - %s, media progress handler offset - %f', action.type, mediaProgressHandlerOffsetX);

        const eventOffsetToMediaProgressContainer = eventPositionX - mediaProgressContainerOffsetStartX;
        const mediaProgressContainerWidth = mediaProgressContainerOffsetEndX - mediaProgressContainerOffsetStartX;

        eventTraversalPosition = Math.round((eventOffsetToMediaProgressContainer / mediaProgressContainerWidth) * 100);
      }

      // we won't be doing anything in case the computed progress value is same
      if (state.mediaProgressHandlerDragPosition === eventTraversalPosition) {
        return state;
      }

      if (onDragUpdate) {
        const mediaProgressValue = getValueFromPosition(eventTraversalPosition, maxValue);
        onDragUpdate(mediaProgressValue);
      }

      return {
        ...state,
        mediaProgressHandlerDragPosition: eventTraversalPosition,
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
        const mediaProgressValue = state.mediaProgressHandlerDragPosition !== undefined
          ? getValueFromPosition(state.mediaProgressHandlerDragPosition, maxValue)
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
        mediaProgressHandlerDragPosition: undefined,
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
  const mediaProgressHandlerRef = useRef(null);

  const [{
    mediaProgressCurrentValue,
    mediaProgressHandlerDragPosition,
    mediaProgressHandlerIsDragging,
  }, mediaProgressStateDispatch] = useReducer(mediaProgressStateReducer, {
    mediaProgressCurrentValue: value,
    mediaProgressHandlerDragPosition: undefined,
    mediaProgressHandlerIsDragging: false,
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
          mediaProgressHandlerRef,
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
    mediaProgressHandlerRef,
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

  const mediaProgressPercentage = `${mediaProgressHandlerDragPosition !== undefined
    ? mediaProgressHandlerDragPosition
    : getPositionFromValue(mediaProgressCurrentValue, maxValue)}%`;

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
        ref={mediaProgressHandlerRef}
        style={{
          left: `${mediaProgressHandlerDragPosition !== undefined
            ? mediaProgressHandlerDragPosition
            : getPositionFromValue(mediaProgressCurrentValue, maxValue)}%`,
        }}
        className={cx('media-progress-handler', progressHandlerClassName, {
          'media-progress-handler-dragging': mediaProgressHandlerIsDragging,
        })}
        onMouseDown={handleOnProgressHandlerMouseDown}
      />
    </div>
  );
}

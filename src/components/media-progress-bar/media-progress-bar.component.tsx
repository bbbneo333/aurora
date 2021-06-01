import React, {
  MouseEvent as ReactMouseEvent,
  useCallback,
  useEffect,
  useReducer,
  useRef,
} from 'react';

import Debug from 'debug';
import classNames from 'classnames/bind';

import {SystemEnums} from '../../enums';

import {MediaButtonComponent} from '../media-button/media-button.component';

import styles from './media-progress-bar.component.scss';

const debug = Debug('app:component:media_progress_bar_component');

const cx = classNames.bind(styles);

enum MediaProgressStateActionType {
  MediaProgressUpdate = 'mediaProgress/update',
  MediaProgressStartDrag = 'mediaProgress/startDrag',
  MediaProgressUpdateDrag = 'mediaProgress/updateDrag',
  MediaProgressEndDrag = 'mediaProgress/endDrag',
  MediaProgressCommitDrag = 'mediaProgress/commitDrag',
  MediaProgressJump = 'mediaProgress/jump',
}

enum MediaProgressJumpDirection {
  Left = 'mediaProgress/jump/left',
  Right = 'mediaProgress/jump/right',
}

type MediaProgressBarComponentProps = {
  value?: number;
  maxValue?: number;
  disabled?: boolean;
  progressContainerClassName?: string;
  progressBarClassName?: string;
  progressHandlerClassName?: string;
  autoCommitOnUpdate?: boolean,
  onDragUpdate?(value: number): boolean;
  onDragEnd?(value: number): boolean;
  onDragCommit?(value: number): void;
};

type MediaProgressState = {
  mediaProgressIsDragging: boolean;
  mediaProgressDragPercent: number;
  mediaProgressUncommittedDragPercent: number | undefined,
};

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

      const mediaProgressDragPercent = getPercentFromValue(mediaProgress, mediaProgressMaxValue);

      return {
        ...state,
        mediaProgressDragPercent,
      };
    }
    case MediaProgressStateActionType.MediaProgressStartDrag: {
      return {
        ...state,
        mediaProgressIsDragging: true,
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
      const mediaProgressUncommittedDragPercent = getPercentFromPosition(eventPositionX, mediaProgressContainerElement, mediaProgressMaxValue);

      // we won't be doing anything in case the computed progress value is same
      if (mediaProgressUncommittedDragPercent === state.mediaProgressDragPercent) {
        return state;
      }

      return {
        ...state,
        mediaProgressUncommittedDragPercent,
      };
    }
    case MediaProgressStateActionType.MediaProgressEndDrag: {
      return {
        ...state,
        mediaProgressIsDragging: false,
      };
    }
    case MediaProgressStateActionType.MediaProgressJump: {
      const {
        eventPositionX,
        eventDirection,
        mediaProgressBarContainerRef,
        mediaProgressMaxValue,
      } = action.data;

      if (state.mediaProgressIsDragging) {
        throw Error('MediaProgressBarComponent encountered error at MediaProgressJump - Progress handler is currently dragging');
      }
      if (state.mediaProgressUncommittedDragPercent !== undefined) {
        throw Error('MediaProgressBarComponent encountered error at MediaProgressJump - Progress handler has existing uncommitted drag');
      }

      // if any of the required references is missing, do nothing, this is just for safety and won't likely happen
      if (!mediaProgressBarContainerRef || !mediaProgressBarContainerRef.current) {
        return state;
      }
      const mediaProgressContainerElement = (mediaProgressBarContainerRef.current as unknown as HTMLDivElement);

      // progress can be jumped in following ways:
      // - via providing event position (x axis)
      // - via providing event direction (left / right)
      let mediaProgressUncommittedDragPercent;

      if (eventPositionX) {
        mediaProgressUncommittedDragPercent = getPercentFromPosition(eventPositionX, mediaProgressContainerElement, mediaProgressMaxValue);
      } else if (eventDirection) {
        if (eventDirection === MediaProgressJumpDirection.Left) {
          mediaProgressUncommittedDragPercent = Math.max(state.mediaProgressDragPercent - 10, 0);
        } else {
          mediaProgressUncommittedDragPercent = Math.min(state.mediaProgressDragPercent + 10, 100);
        }
      }

      // we won't be doing anything in case the progress value could not be calculated or is same
      if (mediaProgressUncommittedDragPercent === undefined || mediaProgressUncommittedDragPercent === state.mediaProgressDragPercent) {
        return state;
      }

      return {
        ...state,
        mediaProgressUncommittedDragPercent,
      };
    }
    case MediaProgressStateActionType.MediaProgressCommitDrag: {
      const {
        mediaProgressPercent,
      } = action.data;

      return {
        ...state,
        mediaProgressDragPercent: mediaProgressPercent,
        mediaProgressUncommittedDragPercent: undefined,
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
    autoCommitOnUpdate = false,
    onDragUpdate,
    onDragEnd,
    onDragCommit,
  } = props;

  const mediaProgressBarContainerRef = useRef(null);

  const [{
    mediaProgressIsDragging,
    mediaProgressDragPercent,
    mediaProgressUncommittedDragPercent,
  }, mediaProgressStateDispatch] = useReducer(mediaProgressStateReducer, {
    mediaProgressIsDragging: false,
    mediaProgressDragPercent: 0,
    mediaProgressUncommittedDragPercent: undefined,
  });

  const handleOnProgressHandlerMouseDown = useCallback((e: ReactMouseEvent) => {
    // for starting drag when mouse is on hold on progress handler
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
  const handleOnProgressHandlerButtonMove = useCallback((e: KeyboardEvent) => {
    // when jumping progress when progress handler is moved via keyboard directional keys
    // only when progress bar is enabled
    if (disabled) {
      return;
    }

    const eventDirection = e.key === SystemEnums.KeyboardKeyCodes.ArrowLeft
      ? MediaProgressJumpDirection.Left
      : MediaProgressJumpDirection.Right;
    debug('onButtonMove - event direction - %s', eventDirection);

    mediaProgressStateDispatch({
      type: MediaProgressStateActionType.MediaProgressJump,
      data: {
        eventDirection,
        mediaProgressBarContainerRef,
        mediaProgressMaxValue: maxValue,
      },
    });
  }, [
    disabled,
    maxValue,
  ]);
  const handleOnProgressContainerMouseClick = useCallback((e: ReactMouseEvent) => {
    // for jumping progress when click is received on progress container
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
        mediaProgressMaxValue: maxValue,
      },
    });

    e.stopPropagation();
    e.preventDefault();
  }, [
    disabled,
    maxValue,
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
    if (disabled && mediaProgressIsDragging) {
      debug('ending drag due to disabled during an active drag');

      mediaProgressStateDispatch({
        type: MediaProgressStateActionType.MediaProgressEndDrag,
      });
    }
  }, [
    disabled,
    mediaProgressIsDragging,
  ]);

  useEffect(() => {
    // for adding / removing handlers whenever we enter / exit drag state
    const handleOnDocumentMouseMove = (e: MouseEvent) => {
      // for tracking and updating drag when progress handler is being dragged
      // only when:
      // - progress bar is enabled
      // - we are currently in drag state
      if (disabled || !mediaProgressIsDragging) {
        return;
      }

      debug('onMouseMove - dragging? - %s, event coords - (x) %f (y) %f', mediaProgressIsDragging, e.pageX, e.pageY);

      mediaProgressStateDispatch({
        type: MediaProgressStateActionType.MediaProgressUpdateDrag,
        data: {
          eventPositionX: e.pageX,
          mediaProgressBarContainerRef,
          mediaProgressMaxValue: maxValue,
        },
      });

      e.stopPropagation();
      e.preventDefault();
    };
    const handleOnDocumentMouseUp = (e: MouseEvent) => {
      // for ending drag when mouse is let go from progress handler
      // only when progress bar is enabled
      if (disabled) {
        return;
      }

      debug('onMouseUp - dragging? - %s, event coords - (x) %f (y) %f', mediaProgressIsDragging, e.pageX, e.pageY);

      mediaProgressStateDispatch({
        type: MediaProgressStateActionType.MediaProgressEndDrag,
      });

      e.stopPropagation();
      e.preventDefault();
    };

    if (mediaProgressIsDragging) {
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
    maxValue,
    mediaProgressIsDragging,
  ]);

  useEffect(() => {
    // for reporting / committing drag updates whenever we are in drag state and have an uncommitted drag
    if (!mediaProgressIsDragging
      || mediaProgressUncommittedDragPercent === undefined) {
      return;
    }

    const mediaProgressUncommittedValue = getValueFromPercent(mediaProgressUncommittedDragPercent, maxValue);

    let mediaProgressCanBeCommitted = autoCommitOnUpdate;
    if (onDragUpdate) {
      debug('reporting onDragUpdate - %o', {
        mediaProgressUncommittedDragPercent,
        mediaProgressUncommittedValue,
      });
      mediaProgressCanBeCommitted = onDragUpdate(mediaProgressUncommittedValue);
    }

    if (mediaProgressCanBeCommitted) {
      if (onDragCommit) {
        debug('committing on drag update - %o', {
          autoCommitOnUpdate,
          mediaProgressUncommittedDragPercent,
          mediaProgressUncommittedValue,
        });
        onDragCommit(mediaProgressUncommittedValue);
      }
      mediaProgressStateDispatch({
        type: MediaProgressStateActionType.MediaProgressCommitDrag,
        data: {
          mediaProgressPercent: mediaProgressUncommittedDragPercent,
        },
      });
    }
  }, [
    autoCommitOnUpdate,
    onDragUpdate,
    onDragCommit,
    maxValue,
    mediaProgressIsDragging,
    mediaProgressUncommittedDragPercent,
  ]);

  useEffect(() => {
    // for reporting and committing uncommitted drag (after drag has been ended)
    if (mediaProgressIsDragging
      || mediaProgressUncommittedDragPercent === undefined) {
      return;
    }

    const mediaProgressUncommittedValue = getValueFromPercent(mediaProgressUncommittedDragPercent, maxValue);

    let mediaProgressCanBeCommitted = true;
    if (onDragEnd) {
      debug('reporting onDragEnd - %o', {
        mediaProgressUncommittedDragPercent,
        mediaProgressUncommittedValue,
      });
      mediaProgressCanBeCommitted = onDragEnd(mediaProgressUncommittedValue);
    }

    let mediaProgressDragPercentToCommit = mediaProgressDragPercent;
    if (mediaProgressCanBeCommitted) {
      mediaProgressDragPercentToCommit = mediaProgressUncommittedDragPercent;

      if (onDragCommit) {
        debug('committing on drag end - %o', {
          mediaProgressUncommittedDragPercent,
          mediaProgressUncommittedValue,
        });
        onDragCommit(mediaProgressUncommittedValue);
      }
    }

    mediaProgressStateDispatch({
      type: MediaProgressStateActionType.MediaProgressCommitDrag,
      data: {
        mediaProgressPercent: mediaProgressDragPercentToCommit,
      },
    });
  }, [
    onDragEnd,
    onDragCommit,
    maxValue,
    mediaProgressIsDragging,
    mediaProgressDragPercent,
    mediaProgressUncommittedDragPercent,
  ]);

  const mediaProgressPercentage = `${mediaProgressUncommittedDragPercent !== undefined
    ? mediaProgressUncommittedDragPercent
    : mediaProgressDragPercent}%`;

  return (
    <div className={cx('media-progress-container', progressContainerClassName, {
      disabled,
      dragging: mediaProgressIsDragging,
    })}
    >
      {/* input interactions will be only done via progress handlers, that's why we don't need any interactivity on progress bar */}
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
      <MediaButtonComponent
        style={{
          left: mediaProgressPercentage,
        }}
        className={cx('media-progress-handler', progressHandlerClassName)}
        onMouseDown={handleOnProgressHandlerMouseDown}
        onButtonMove={handleOnProgressHandlerButtonMove}
      />
    </div>
  );
}

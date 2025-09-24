import React, {
  MouseEvent as ReactMouseEvent,
  useCallback,
  useEffect,
  useReducer,
  useRef,
} from 'react';

import classNames from 'classnames/bind';

import { SystemEnums } from '../../enums';

import { Button } from '../button/button.component';

import { getValueFromPercent } from './progress-bar.utils';
import { ProgressJumpDirection, ProgressStateActionType, progressStateReducer } from './progress-bar.reducer';
import styles from './progress-bar.component.scss';

const debug = require('debug')('app:component:progress_bar');

const cx = classNames.bind(styles);

export type ProgressBarComponentProps = {
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

export function ProgressBar(props: ProgressBarComponentProps = {}) {
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
  }, mediaProgressStateDispatch] = useReducer(progressStateReducer, {
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
      type: ProgressStateActionType.StartDrag,
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
      ? ProgressJumpDirection.Left
      : ProgressJumpDirection.Right;
    debug('onButtonMove - event direction - %s', eventDirection);

    mediaProgressStateDispatch({
      type: ProgressStateActionType.Jump,
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
      type: ProgressStateActionType.Jump,
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
      type: ProgressStateActionType.Update,
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
        type: ProgressStateActionType.EndDrag,
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
        type: ProgressStateActionType.UpdateDrag,
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
        type: ProgressStateActionType.EndDrag,
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
        type: ProgressStateActionType.CommitDrag,
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
      type: ProgressStateActionType.CommitDrag,
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
      <Button
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

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import classNames from 'classnames/bind';

import styles from './media-progress-bar.component.css';

const debug = require('debug')('app:component:media_progress_bar_component');

const cx = classNames.bind(styles);

type MediaProgressBarComponentProps = {
  value?: number;
  progressContainerClassName?: string;
  progressBarClassName?: string;
  progressHandlerClassName?: string;
};

export function MediaProgressBarComponent(props: MediaProgressBarComponentProps = {}) {
  const {
    value,
    progressContainerClassName,
    progressBarClassName,
    progressHandlerClassName,
  } = props;

  const mediaProgressBarContainerRef = useRef(null);
  const mediaProgressHandlerRef = useRef(null);
  const [mediaProgressCurrentValue, setMediaProgressCurrentValue] = useState(value || 0);
  const [mediaProgressHandlerIsDragging, setMediaProgressHandlerAsDragging] = useState(false);

  const onHandlerMouseMove = useCallback((e: MouseEvent) => {
    debug('onMouseMove - event coords - (x) %d (y) %d', e.pageX, e.pageY);

    if (!mediaProgressBarContainerRef || !mediaProgressBarContainerRef.current) return;
    if (!mediaProgressHandlerRef || !mediaProgressHandlerRef.current) return;

    const mediaProgressContainerElement = (mediaProgressBarContainerRef.current as unknown as HTMLDivElement);
    const mediaProgressHandlerElement = (mediaProgressHandlerRef.current as unknown as HTMLDivElement);

    const eventOffsetX = e.pageX;
    const mediaProgressContainerOffsetStartX = mediaProgressContainerElement.getBoundingClientRect().left;
    const mediaProgressContainerOffsetEndX = mediaProgressContainerElement.getBoundingClientRect().right;
    const mediaProgressHandlerOffsetX = mediaProgressHandlerElement.getBoundingClientRect().left;

    if (eventOffsetX < mediaProgressContainerOffsetStartX) {
      // drag is out of bounds from start
      setMediaProgressCurrentValue(0);
      return;
    }

    if (eventOffsetX > mediaProgressContainerOffsetEndX) {
      // drag is out of bounds from end
      setMediaProgressCurrentValue(100);
      return;
    }

    debug('onMouseMove - media progress container offset - (start) %d (end) %d', mediaProgressContainerOffsetStartX, mediaProgressContainerOffsetEndX);
    debug('onMouseMove - media progress handler offset - %d', mediaProgressHandlerOffsetX);

    const eventOffsetToMediaProgressContainer = eventOffsetX - mediaProgressContainerOffsetStartX;
    const mediaProgressContainerWidth = mediaProgressContainerOffsetEndX - mediaProgressContainerOffsetStartX;
    const eventTraversalPercentage = Math.round((eventOffsetToMediaProgressContainer / mediaProgressContainerWidth) * 100);

    debug('onMouseMove - event traversal percentage - %d', eventTraversalPercentage);
    setMediaProgressCurrentValue(eventTraversalPercentage);

    e.stopPropagation();
    e.preventDefault();
  }, [setMediaProgressHandlerAsDragging]);
  const onHandlerMouseUp = useCallback((e: MouseEvent) => {
    debug('onMouseUp - dragging? - %s', mediaProgressHandlerIsDragging);

    setMediaProgressHandlerAsDragging(false);

    e.stopPropagation();
    e.preventDefault();
  }, [setMediaProgressHandlerAsDragging]);
  const onHandlerMouseDown = useCallback((e: MouseEvent) => {
    // only left mouse button
    if (e.button !== 0) return;
    debug('onMouseDown - dragging? - %s', mediaProgressHandlerIsDragging);

    setMediaProgressHandlerAsDragging(true);

    e.stopPropagation();
    e.preventDefault();
  }, [setMediaProgressHandlerAsDragging]);

  useEffect(() => {
    if (mediaProgressHandlerIsDragging) {
      debug('registering handlers');
      document.addEventListener('mousemove', onHandlerMouseMove);
      document.addEventListener('mouseup', onHandlerMouseUp);
    } else {
      debug('de-registering handlers');
      document.removeEventListener('mousemove', onHandlerMouseMove);
      document.removeEventListener('mouseup', onHandlerMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', onHandlerMouseMove);
      document.removeEventListener('mouseup', onHandlerMouseUp);
    };
  }, [
    mediaProgressHandlerIsDragging,
    onHandlerMouseMove,
    onHandlerMouseUp,
  ]);

  useEffect(() => {
    if (!mediaProgressHandlerRef || !mediaProgressHandlerRef.current) {
      return () => {
      };
    }

    const mediaProgressHandlerElement = (mediaProgressHandlerRef.current as unknown as HTMLDivElement);
    mediaProgressHandlerElement.addEventListener('mousedown', onHandlerMouseDown);

    return () => {
      mediaProgressHandlerElement.removeEventListener('mousedown', onHandlerMouseDown);
    };
  }, [
    mediaProgressHandlerRef,
    onHandlerMouseDown,
  ]);

  useEffect(() => {
    if (!mediaProgressBarContainerRef || !mediaProgressBarContainerRef.current) {
      return () => {
      };
    }

    const mediaProgressContainerElement = (mediaProgressBarContainerRef.current as unknown as HTMLDivElement);
    mediaProgressContainerElement.addEventListener('click', onHandlerMouseMove);

    return () => {
      mediaProgressContainerElement.removeEventListener('click', onHandlerMouseMove);
    };
  }, [
    mediaProgressBarContainerRef,
    onHandlerMouseMove,
  ]);

  return (
    <div className={cx('media-progress-container', progressContainerClassName)}>
      <div
        ref={mediaProgressBarContainerRef}
        className={cx('media-progress-bar-container')}
      >
        <div
          style={{
            width: `${mediaProgressCurrentValue}%`,
          }}
          className={cx('media-progress-bar', progressBarClassName, {
            'media-progress-bar-dragging': mediaProgressHandlerIsDragging,
          })}
        />
      </div>
      <div
        ref={mediaProgressHandlerRef}
        aria-label="Media Progress Handler"
        style={{
          left: `${mediaProgressCurrentValue}%`,
        }}
        className={cx('media-progress-handler', progressHandlerClassName, {
          'media-progress-handler-dragging': mediaProgressHandlerIsDragging,
        })}
      />
    </div>
  );
}

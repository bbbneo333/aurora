import classNames from 'classnames/bind';
import React from 'react';

import { Text, TextProps } from './text.component';

import styles from './text.component.css';

const cx = classNames.bind(styles);

export type TextMarqueeProps = {
  speed?: number; // in pixels
  delay?: number; // in seconds
} & TextProps;

export function TextMarquee(props: TextMarqueeProps) {
  const {
    speed = 30,
    delay = 0,
    children,
    ...rest
  } = props;

  const containerRef = React.useRef<HTMLDivElement>(null);
  const textRef = React.useRef<HTMLSpanElement>(null);
  const [isOverflowing, setIsOverflowing] = React.useState(false);
  const [animationDuration, setAnimationDuration] = React.useState(0);
  const [textWidth, setTextWidth] = React.useState(0);

  React.useEffect(() => {
    const container = containerRef.current;
    const text = textRef.current;
    if (container && text) {
      const containerWidth = container.clientWidth;
      const textScrollWidth = text.scrollWidth;
      const overflow = textScrollWidth > containerWidth;
      setIsOverflowing(overflow);
      setTextWidth(textScrollWidth);

      if (overflow) {
        setAnimationDuration((textScrollWidth + containerWidth) / speed); // seconds
      }
    }
  }, [
    children,
    speed,
  ]);

  return (
    <div
      ref={containerRef}
      className={cx('text-marquee-container')}
    >
      <Text
        ref={textRef}
        {...rest}
        className={cx('text-marquee', {
          active: isOverflowing,
        })}
        style={{
          animationDuration: `${animationDuration}s`,
          animationDelay: `${delay}s`,
          // @ts-ignore
          '--marquee-width': `${textWidth}px`,
        }}
      >
        {children}
      </Text>
    </div>
  );
}

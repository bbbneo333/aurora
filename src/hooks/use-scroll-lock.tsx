import { useCallback } from 'react';

export type UseScrollLockProps = {
  scrollableSelector: string;
  blockableSelector: string;
};

export function useScrollLock(props: UseScrollLockProps) {
  // this hooks adds locked class to provided scrollableSelector
  // if blockableSelector was found in DOM
  // to trigger, call triggerScrollLock

  const { scrollableSelector, blockableSelector } = props;

  const shouldLock = useCallback(() => !!document.querySelector(blockableSelector), [
    blockableSelector,
  ]);

  const lockScroll = useCallback(() => {
    document.querySelectorAll(scrollableSelector).forEach((el) => {
      el.classList.add('locked');
    });
  }, [scrollableSelector]);

  const unlockScroll = useCallback(() => {
    document.querySelectorAll(scrollableSelector).forEach((el) => {
      el.classList.remove('locked');
    });
  }, [scrollableSelector]);

  const triggerScrollLock = useCallback(() => {
    if (shouldLock()) {
      lockScroll();
    } else {
      unlockScroll();
    }
  }, [lockScroll, shouldLock, unlockScroll]);

  return {
    triggerScrollLock,
  };
}

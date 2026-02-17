export function getPercentFromValue(mediaProgressValue: number, mediaProgressMaxThreshold: number): number {
  return (mediaProgressValue / mediaProgressMaxThreshold) * 100;
}

export function getValueFromPercent(mediaProgressPercent: number, mediaProgressMaxThreshold: number): number {
  const value = (mediaProgressPercent / 100) * mediaProgressMaxThreshold;
  return Number(value.toFixed());
}

export function getPercentFromPosition(mediaProgressPosition: number, mediaProgressContainerElement: HTMLDivElement, mediaProgressMaxThreshold: number): number {
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
    // debug('getPercentFromPosition - media progress position - (x) %f', mediaProgressPosition);
    // debug('getPercentFromPosition - media progress container position - (start) %f (end) %f', mediaProgressContainerPositionStartX, mediaProgressContainerPositionEndX);

    const mediaProgressOffset = mediaProgressPosition - mediaProgressContainerPositionStartX;
    const mediaProgressContainerWidth = mediaProgressContainerPositionEndX - mediaProgressContainerPositionStartX;

    const mediaProgressContainerBreakpoint = mediaProgressContainerWidth / mediaProgressMaxThreshold;
    const mediaProgressNearBreakpoint = Math.ceil((mediaProgressOffset / mediaProgressContainerBreakpoint)) * mediaProgressContainerBreakpoint;

    mediaProgressPercent = getPercentFromValue(mediaProgressNearBreakpoint, mediaProgressContainerWidth);
  }

  return mediaProgressPercent;
}

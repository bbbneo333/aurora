import React, {MutableRefObject, useLayoutEffect} from 'react';
import {useLocation} from 'react-router-dom';

export function BrowserScroll(props: {
  browserRef: MutableRefObject<null>,
}) {
  const {browserRef} = props;
  const location = useLocation();

  // navigating to new page won't automatically reset the scroll and will reuse the old scroll position
  // we are scrolling the browser position to top everytime the path changes
  useLayoutEffect(() => {
    const browserContainer = browserRef.current as unknown as HTMLDivElement;

    if (browserContainer) {
      browserContainer.scrollTo(0, 0);
    }
  }, [
    browserRef,
    location.pathname,
  ]);

  return (
    <></>
  );
}

import { useSelector } from 'react-redux';
import { useCallback, useEffect, useState } from 'react';

import { IMediaCollectionItem } from '../interfaces';
import { makeSelectIsCollectionPinned } from '../selectors';
import { MediaPinnedItemService } from '../services';

export function useMediaCollectionPin(props: {
  mediaItem: IMediaCollectionItem;
}) {
  const { mediaItem } = props;

  const isPinned = useSelector(makeSelectIsCollectionPinned(mediaItem));
  const [isPinnedStatusLoading, setIsPinnedStatusLoading] = useState(false);

  useEffect(() => {
    MediaPinnedItemService.loadPinnedItemStatus(mediaItem);
  }, [
    mediaItem,
  ]);

  const togglePinned = useCallback(async () => {
    setIsPinnedStatusLoading(true);

    try {
      if (isPinned) {
        // remove
        await MediaPinnedItemService.unpinCollectionItem(mediaItem);
      } else {
        // add
        await MediaPinnedItemService.pinCollectionItem(mediaItem);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsPinnedStatusLoading(false);
    }
  }, [
    isPinned,
    mediaItem,
  ]);

  return {
    isPinned,
    isPinnedStatusLoading,
    togglePinned,
  };
}

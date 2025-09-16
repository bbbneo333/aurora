import { every, isNil, values } from 'lodash';
import { createSelector } from 'reselect';

import { IMediaCollectionItem } from '../interfaces';
import { RootState } from '../reducers';
import { MediaUtils } from '../utils';

export const selectMediaLikedTracksRecord = (state: RootState) => state.mediaLibrary.mediaLikedTracksRecord;

export const selectSortedLikedTracks = createSelector(
  [selectMediaLikedTracksRecord],
  mediaLikedTracksRecord => MediaUtils.sortMediaLikedTracks(values(mediaLikedTracksRecord)),
);

export const makeSelectIsTrackLiked = (trackId?: string) => createSelector(
  [selectMediaLikedTracksRecord],
  mediaLikedTracksRecord => !!trackId && !!mediaLikedTracksRecord[trackId],
);

export const makeSelectAreAllTracksLiked = (trackIds?: string[]) => createSelector(
  [selectMediaLikedTracksRecord],
  (mediaLikedTracksRecord) => {
    if (!trackIds || trackIds.length === 0) return false;

    return every(trackIds, (id: string) => !isNil(mediaLikedTracksRecord[id]));
  },
);

export const selectMediaPinnedItemsRecord = (state: RootState) => state.mediaLibrary.mediaPinnedItemsRecord;

export const selectSortedPinnedItems = createSelector(
  [selectMediaPinnedItemsRecord],
  mediaPinnedItemsRecord => MediaUtils.sortMediaPinnedItems(values(mediaPinnedItemsRecord)),
);

export const makeSelectIsCollectionPinned = (item: IMediaCollectionItem) => createSelector(
  [selectMediaPinnedItemsRecord],
  mediaPinnedItemsRecord => !!mediaPinnedItemsRecord[MediaUtils.getPinnedItemKeyFromCollection(item)],
);

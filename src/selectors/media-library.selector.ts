import { every, isNil, values } from 'lodash';
import { createSelector } from 'reselect';

import { IMediaLikedTrackInputData, IMediaPinnedItemInputData } from '../interfaces';
import { RootState } from '../reducers';
import { MediaUtils } from '../utils';

export const selectMediaLikedTracksRecord = (state: RootState) => state.mediaLibrary.mediaLikedTracksRecord;

export const selectSortedLikedTracks = createSelector(
  [selectMediaLikedTracksRecord],
  mediaLikedTracksRecord => MediaUtils.sortMediaLikedTracks(values(mediaLikedTracksRecord)),
);

export const makeSelectIsTrackLiked = (input?: IMediaLikedTrackInputData) => createSelector(
  [selectMediaLikedTracksRecord],
  mediaLikedTracksRecord => !!input && !!mediaLikedTracksRecord[MediaUtils.getLikedTrackKeyFromInput(input)],
);

export const makeSelectAreAllTracksLiked = (inputList?: IMediaLikedTrackInputData[]) => createSelector(
  [selectMediaLikedTracksRecord],
  (mediaLikedTracksRecord) => {
    if (!inputList || inputList.length === 0) return false;

    return every(inputList, input => !isNil(mediaLikedTracksRecord[MediaUtils.getLikedTrackKeyFromInput(input)]));
  },
);

export const selectMediaPinnedItemsRecord = (state: RootState) => state.mediaLibrary.mediaPinnedItemsRecord;

export const selectSortedPinnedItems = createSelector(
  [selectMediaPinnedItemsRecord],
  mediaPinnedItemsRecord => MediaUtils.sortMediaPinnedItems(values(mediaPinnedItemsRecord)),
);

export const makeSelectIsCollectionPinned = (input?: IMediaPinnedItemInputData) => createSelector(
  [selectMediaPinnedItemsRecord],
  mediaPinnedItemsRecord => !!input && !!mediaPinnedItemsRecord[MediaUtils.getPinnedItemKeyFromInput(input)],
);

export const selectMediaPlaylists = (state: RootState) => state.mediaLibrary.mediaPlaylists;

export const selectSortedPlaylists = createSelector(
  [selectMediaPlaylists],
  mediaPlaylists => MediaUtils.sortMediaPlaylists(mediaPlaylists),
);

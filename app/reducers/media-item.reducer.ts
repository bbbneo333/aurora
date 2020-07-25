import {IMediaItem} from '../interfaces';
import {MediaEnums} from '../enums';

export function mediaItemReducer(state: IMediaItem[], action: {
  type: MediaEnums.MediaLibraryActions,
  data?: any,
}): IMediaItem[] {
  switch (action.type) {
    case MediaEnums.MediaLibraryActions.ADD_TRACK:
      return [...state, action.data];
    default:
      return state;
  }
}

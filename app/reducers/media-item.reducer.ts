import {IMediaItem} from "../interfaces";
import {MediaEnums} from "../enums";

export function mediaItemReducer(state: IMediaItem[], action: {
  type: MediaEnums.MediaLibraryActions,
}): IMediaItem[] {
  switch (action.type) {
    case MediaEnums.MediaLibraryActions.ADD_TRACKS:
      return [...state, {id: 'someRandomId1', track_name: 'someRandomTrackName'}];
    default:
      return state;
  }
}

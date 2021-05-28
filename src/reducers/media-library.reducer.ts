import * as _ from 'lodash';

import {MediaEnums} from '../enums';
import {IMediaTrack} from '../interfaces';

export interface MediaLibraryState {
  mediaTracks: IMediaTrack[];
}

const mediaLibraryInitialState: MediaLibraryState = {
  mediaTracks: [],
};

export interface MediaLibraryStateAction {
  type: MediaEnums.MediaLibraryActions,
  data?: any,
}

export default (state: MediaLibraryState = mediaLibraryInitialState, action: MediaLibraryStateAction): MediaLibraryState => {
  switch (action.type) {
    case MediaEnums.MediaLibraryActions.AddTrack: {
      // data.mediaTrack: MediaTrack - track which needs to be added
      return {
        ...state,
        mediaTracks: [...state.mediaTracks, action.data.mediaTrack],
      };
    }
    case MediaEnums.MediaLibraryActions.RemoveTrack: {
      // data.mediaTrackId: String - track's id which needs to be removed
      return {
        ...state,
        mediaTracks: _.filter(state.mediaTracks, mediaTrack => mediaTrack.id !== action.data.mediaTrackId),
      };
    }
    default:
      return state;
  }
};

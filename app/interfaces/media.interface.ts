import {MediaEnums} from '../enums';

export interface IMediaItem {
  id: string;
  track_name: string;
  location: {
    address: string;
    type: MediaEnums.MediaItemLocationType;
  };
}

export interface IMediaItemLibraryManageAction {
  type: MediaEnums.MediaLibraryActions;
  data: any;
}

export interface IMediaItemPlaybackQueueManageAction {
  type: MediaEnums.MediaPlaybackQueueActions;
  data?: any;
}

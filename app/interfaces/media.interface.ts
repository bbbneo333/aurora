import {MediaEnums} from '../enums';

export interface IMediaItem {
  id: string;
  track_name: string;
}

export interface IMediaLibraryManager {
  addTracksFromDirectory(): void;
}

export interface IMediaItemManageAction {
  type: MediaEnums.MediaLibraryActions;
  data: any;
}

import {MediaEnums} from '../enums';
import {IMediaItem} from '../interfaces';

export type MediaItemData = {
  id: any;
  track_name: any;
  location: {
    address: string;
    type: MediaEnums.MediaItemLocationType;
  };
};

export class MediaItem implements IMediaItem {
  id: string;
  track_name: string;
  location: {
    address: string;
    type: MediaEnums.MediaItemLocationType;
  };

  constructor(data: MediaItemData) {
    this.id = data.id;
    this.track_name = data.track_name;
    this.location = {
      address: data.location.address,
      type: data.location.type,
    };
  }
}

import {MediaEnums} from '../enums';

type MediaTrackData = {
  id: any;
  track_name: any;
  location: {
    address: string;
    type: MediaEnums.MediaTrackLocationType;
  };
};

export class MediaTrack {
  id: string;
  track_name: string;
  location: {
    address: string;
    type: MediaEnums.MediaTrackLocationType;
  };

  constructor(data: MediaTrackData) {
    this.id = data.id;
    this.track_name = data.track_name;
    this.location = {
      address: data.location.address,
      type: data.location.type,
    };
  }
}

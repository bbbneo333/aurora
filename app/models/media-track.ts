import {MediaEnums} from '../enums';

type MediaTrackData = {
  id: any;
  track_name: string;
  track_album_name: string;
  track_duration: number;
  location: {
    address: string;
    type: MediaEnums.MediaTrackLocationType;
  };
};

export class MediaTrack {
  id: string;
  track_name: string;
  track_album_name: string;
  track_duration: number;
  location: {
    address: string;
    type: MediaEnums.MediaTrackLocationType;
  };

  constructor(data: MediaTrackData) {
    this.id = data.id;
    this.track_name = data.track_name;
    this.track_album_name = data.track_album_name;
    this.track_duration = data.track_duration;
    this.location = {
      address: data.location.address,
      type: data.location.type,
    };
  }
}

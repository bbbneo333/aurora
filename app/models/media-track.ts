import {MediaEnums} from '../enums';

type MediaTrackCoverPicture = {
  image_data: any,
  image_data_type: MediaEnums.MediaTrackCoverPictureImageDataType,
  image_format: string,
};

type MediaTrackData = {
  id: any;
  track_name: string;
  track_artists: string[],
  track_album_name: string;
  track_duration: number;
  track_cover_picture?: MediaTrackCoverPicture;
  location: {
    address: string;
    type: MediaEnums.MediaTrackLocationType;
  };
};

export class MediaTrack {
  id: string;
  track_name: string;
  track_artists: string[];
  track_album_name: string;
  track_duration: number;
  track_cover_picture?: MediaTrackCoverPicture;
  location: {
    address: string;
    type: MediaEnums.MediaTrackLocationType;
  };

  constructor(data: MediaTrackData) {
    this.id = data.id;
    this.track_name = data.track_name;
    this.track_artists = data.track_artists;
    this.track_album_name = data.track_album_name;
    this.track_duration = data.track_duration;
    this.track_cover_picture = data.track_cover_picture;
    this.location = {
      address: data.location.address,
      type: data.location.type,
    };
  }
}

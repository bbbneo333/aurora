import {IMediaTrack, IMediaTrackCoverPicture} from '../../interfaces';

import MediaLocalConstants from './media-local.constants.json';

type MediaLocalTrackData = {
  id: any;
  track_name: string;
  track_artists: string[],
  track_album_name: string;
  track_duration: number;
  track_cover_picture?: IMediaTrackCoverPicture;
  location: {
    address: string;
  };
};

export class MediaLocalTrack implements IMediaTrack {
  readonly provider = MediaLocalConstants.Provider;
  id: string;
  track_name: string;
  track_artists: string[];
  track_album_name: string;
  track_duration: number;
  track_cover_picture?: IMediaTrackCoverPicture;
  location: {
    address: string;
  };

  constructor(data: MediaLocalTrackData) {
    this.id = data.id;
    this.track_name = data.track_name;
    this.track_artists = data.track_artists;
    this.track_album_name = data.track_album_name;
    this.track_duration = data.track_duration;
    this.track_cover_picture = data.track_cover_picture;
    this.location = {
      address: data.location.address,
    };
  }
}

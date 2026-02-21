import { IMediaTrack } from '../../interfaces';

export interface IMediaLocalSettings {
  library: {
    directories: string[];
  }
}

export interface IMediaLocalTrack extends IMediaTrack {
  extra: {
    location: {
      address: string;
    },
    mtime?: number;
    size?: number;
  }
}

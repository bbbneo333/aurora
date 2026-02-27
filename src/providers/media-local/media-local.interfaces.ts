import { IMediaTrack } from '../../interfaces';

export interface IMediaLocalSettings {
  library: {
    directories: string[];
  }
}

export interface IMediaLocalTrack extends IMediaTrack {
  extra: {
    file_source: string;
    file_path: string;
    file_mtime?: number;
    file_size?: number;
  }
}

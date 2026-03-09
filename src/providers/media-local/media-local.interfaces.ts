import { IMediaTrack } from '../../interfaces';

export interface IMediaLocalSettings {
  library: {
    directories: string[];
    group_compilations_by_folder?: boolean;
  };
  cd_import?: {
    output_directory?: string;
    naming_template?: string;
    discogs_token?: string;
  };
}

export interface IMediaLocalTrack extends IMediaTrack {
  extra: {
    file_source: string;
    file_path: string;
    file_mtime?: number;
    file_size?: number;
  }
}

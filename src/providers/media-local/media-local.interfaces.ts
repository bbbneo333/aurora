import {
  IMediaLibraryService,
  IMediaPlaybackService,
  IMediaSettingsService,
  IMediaTrack,
} from '../../interfaces';

export interface IMediaLocalLibraryService extends IMediaLibraryService {
}

export interface IMediaLocalPlaybackService extends IMediaPlaybackService {
}

export interface IMediaLocalSettingsService extends IMediaSettingsService {
}

export interface IMediaLocalSettings {
  library: {
    directories: string[]
  }
}

export interface IMediaLocalTrack extends IMediaTrack {
  extra: {
    location: {
      address: string,
    },
  },
}

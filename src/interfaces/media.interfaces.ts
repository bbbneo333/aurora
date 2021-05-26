import {MediaEnums} from '../enums';

export interface MediaTrackCoverPicture {
  image_data: any,
  image_data_type: MediaEnums.MediaTrackCoverPictureImageDataType,
  image_format: string,
}

export interface IMediaTrack {
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
}

export interface IMediaPlayback {
  play(): Promise<boolean>;

  checkIfPlaying(): boolean;

  getPlaybackProgress(): number;

  seekPlayback(mediaPlaybackSeekPosition: number): Promise<boolean>;

  pausePlayback(): Promise<boolean>;

  resumePlayback(): Promise<boolean>;

  stopPlayback(): Promise<boolean>;

  changePlaybackVolume(mediaPlaybackVolume: number, mediaPlaybackMaxVolume: number): Promise<boolean>;

  mutePlaybackVolume(): Promise<boolean>;

  unmutePlaybackVolume(): Promise<boolean>;
}

export interface IMediaPlaybackOptions {
  mediaPlaybackVolume: number;
  mediaPlaybackMaxVolume: number;
}

export interface IMediaLibraryService {
}

export interface IMediaPlaybackService {
  playMediaTrack(mediaTrack: IMediaTrack, mediaPlaybackOptions: IMediaPlaybackOptions): IMediaPlayback;
}

export interface IMediaProvider {
  mediaLibraryService: IMediaLibraryService;
  mediaPlaybackService: IMediaPlaybackService;
}

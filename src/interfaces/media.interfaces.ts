import {TypedEmitter} from 'tiny-typed-emitter';

import {MediaEnums} from '../enums';

export interface IMediaTrackCoverPicture {
  image_data: any,
  image_data_type: MediaEnums.MediaTrackCoverPictureImageDataType,
  image_format: string,
}

export interface IMediaTrack {
  readonly provider: string;
  id: any;
  track_name: string;
  track_artists: string[],
  track_album_name: string;
  track_duration: number;
  track_cover_picture?: IMediaTrackCoverPicture;
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

export interface IMediaLibraryEvents {
  [MediaEnums.MediaLibraryUpdateEvent.AddedTrack]: (mediaTrack: IMediaTrack) => void;
}

export interface IMediaLibraryService extends TypedEmitter<IMediaLibraryEvents> {
  addMediaTracks(): void;

  removeMediaTrack(mediaTrack: IMediaTrack): boolean;
}

export interface IMediaPlaybackService {
  playMediaTrack(mediaTrack: IMediaTrack, mediaPlaybackOptions: IMediaPlaybackOptions): IMediaPlayback;
}

export interface IMediaProvider {
  mediaProviderNamespace: string;
  mediaLibraryService: IMediaLibraryService;
  mediaPlaybackService: IMediaPlaybackService;
}

import React from 'react';

import {MediaEnums} from '../enums';

export interface IMediaTrackData {
  readonly id: string;
  readonly provider: string;
  readonly provider_id?: string;
  readonly track_name: string;
  readonly track_number: number;
  readonly track_duration: number;
  readonly track_cover_picture?: IMediaPicture;
  readonly track_artist_ids: string[],
  readonly track_album_id: string,
  readonly extra?: object;
}

export interface IMediaAlbumData {
  readonly id: string;
  readonly provider: string;
  readonly provider_id?: string;
  readonly album_name: string;
  readonly album_artist_id: string;
  readonly album_cover_picture?: IMediaPicture;
  readonly extra?: object;
}

export interface IMediaArtistData {
  readonly id: string;
  readonly provider: string;
  readonly provider_id?: string;
  readonly artist_name: string;
  readonly artist_display_picture?: IMediaPicture;
  readonly artist_feature_picture?: IMediaPicture;
  readonly extra?: object;
}

export interface IMediaTrackProviderData {
  readonly provider_id?: string;
  readonly track_name: string;
  readonly track_number: number;
  readonly track_duration: number;
  readonly track_cover_picture?: IMediaPicture;
  readonly track_artists: IMediaArtistProviderData[];
  readonly track_album: IMediaAlbumProviderData;
  readonly extra?: object;
}

export interface IMediaAlbumProviderData {
  readonly provider_id?: string;
  readonly album_name: string;
  readonly album_artist: IMediaArtistProviderData;
  readonly album_cover_picture?: IMediaPicture;
  readonly extra?: object;
}

export interface IMediaArtistProviderData {
  readonly provider_id?: string;
  readonly artist_name: string;
  readonly artist_display_picture?: IMediaPicture;
  readonly artist_feature_picture?: IMediaPicture;
  readonly extra?: object;
}

export interface IMediaTrack {
  readonly id: string;
  readonly provider: string;
  readonly provider_id?: string;
  readonly track_name: string;
  readonly track_number: number;
  readonly track_duration: number;
  readonly track_cover_picture?: IMediaPicture;
  readonly track_artists: IMediaArtist[];
  readonly track_album: IMediaAlbum;
  readonly extra?: object;
}

export interface IMediaAlbum {
  readonly id: string;
  readonly provider: string;
  readonly provider_id?: string;
  readonly album_name: string;
  readonly album_artist: IMediaArtist;
  readonly album_cover_picture?: IMediaPicture;
  readonly extra?: object;
}

export interface IMediaArtist {
  readonly id: string;
  readonly provider: string;
  readonly provider_id?: string;
  readonly artist_name: string;
  readonly artist_display_picture?: IMediaPicture;
  readonly artist_feature_picture?: IMediaPicture;
  readonly extra?: object;
}

export interface IMediaPicture {
  image_data: any;
  image_data_type: MediaEnums.MediaTrackCoverPictureImageDataType;
  image_format: string;
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

export interface IMediaSettingsComponent extends React.FC<any> {
}

export interface IMediaLibraryService {
  removeMediaTrack(mediaTrack: IMediaTrack): Promise<boolean>;
}

export interface IMediaPlaybackService {
  playMediaTrack(mediaTrack: IMediaTrack, mediaPlaybackOptions: IMediaPlaybackOptions): IMediaPlayback;
}

export interface IMediaSettingsService {
  getDefaultSettings(): any;

  getSettingsComponent(): IMediaSettingsComponent | undefined;
}

export interface IMediaProviderData {
  identifier: string;
  enabled: boolean;
  settings: object;
  options: object;
}

export interface IMediaProviderDataUpdateParams {
  settings?: object;
}

export interface IMediaProvider {
  mediaProviderIdentifier: string;
  mediaLibraryService: IMediaLibraryService;
  mediaPlaybackService: IMediaPlaybackService;
  mediaSettingsService: IMediaSettingsService;
}

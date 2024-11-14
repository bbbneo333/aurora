import React from 'react';

import { MediaEnums } from '../enums';

export interface IMediaTrackData {
  id: string;
  provider: string;
  provider_id: string;
  sync_timestamp: number;
  track_name: string;
  track_number: number;
  track_duration: number;
  track_cover_picture?: IMediaPicture;
  track_artist_ids: string[];
  track_album_id: string;
  extra?: object;
}

export interface IMediaAlbumData {
  id: string;
  provider: string;
  provider_id: string;
  sync_timestamp: number;
  album_name: string;
  album_artist_id: string;
  album_cover_picture?: IMediaPicture;
  extra?: object;
}

export interface IMediaArtistData {
  id: string;
  provider: string;
  provider_id: string;
  sync_timestamp: number;
  artist_name: string;
  artist_feature_picture?: IMediaPicture;
  extra?: object;
}

export interface IMediaTrack extends IMediaTrackData {
  track_artists: IMediaArtist[];
  track_album: IMediaAlbum;
}

export interface IMediaTrackList {
  id: string;
}

export interface IMediaQueueTrack extends IMediaTrack {
  tracklist_id: string;
  queue_entry_id: string;
  queue_insertion_index: number;
}

export interface IMediaAlbum extends IMediaAlbumData {
  album_artist: IMediaArtist;
}

export interface IMediaArtist extends IMediaArtistData {
}

export interface IMediaPicture {
  image_data: any;
  image_data_type: MediaEnums.MediaTrackCoverPictureImageDataType;
  image_format: string;
}

export interface IMediaPlayback {
  play(): Promise<boolean>;

  checkIfLoading(): boolean;

  checkIfPlaying(): boolean;

  checkIfEnded(): boolean;

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
  mediaPlaybackVolumeMuted: boolean;
}

export interface IMediaSettingsComponent extends React.FC<any> {
}

export interface IMediaLibraryService {
  syncMediaTracks(): Promise<void>;

  removeMediaTrack?(mediaTrack: IMediaTrack): Promise<boolean>;
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
  sync_started_at: number | null;
  sync_finished_at: number | null;
}

export interface IMediaProvider {
  mediaProviderIdentifier: string;
  mediaLibraryService: IMediaLibraryService;
  mediaPlaybackService: IMediaPlaybackService;
  mediaSettingsService: IMediaSettingsService;

  onMediaProviderRegistered?(): void;

  onMediaProviderSettingsUpdated?(existingSettings: object, updatedSettings: object): void;
}

export interface IMediaCollectionItem {
  id: string;
  type: 'artist' | 'album' | 'playlist';
  name: string;
  picture?: IMediaPicture;
}

export interface IMediaPlaylistData {
  id: string;
  name: string;
  tracks: IMediaPlaylistTrackData[];
  cover_picture?: IMediaPicture;
  created_at: number;
}

export interface IMediaPlaylistTrackData {
  id: string;
  added_at: number;
}

export interface IMediaPlaylist extends IMediaPlaylistData {
}

export interface IMediaPlaylistTrack extends IMediaPlaylistTrackData, IMediaTrack {
}

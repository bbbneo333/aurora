export enum MediaFileExtensions {
  FLAC = '.flac',
  MP3 = '.mp3',
  M4A = '.m4a',
  WAV = '.wav',
}

export enum MediaLibraryActions {
  ADD_TRACK,
  REMOVE_TRACK,
}

export enum MediaPlaybackQueueActions {
  CLEAR,
  ADD_TRACK,
  REMOVE_TRACK,
}

export enum MediaPlaybackState {
  Playing,
  Paused,
  Loading,
  Idle,
}

export enum MediaItemLocationType {
  LocalFileSystem,
}

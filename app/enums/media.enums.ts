export enum MediaFileExtensions {
  FLAC = 'flac',
  MP3 = 'mp3',
  M4A = 'm4a',
  WAV = 'wav',
}

export enum MediaLibraryActions {
  AddTrack = 'media/library/addTrack',
  RemoveTrack = 'media/library/removeTrack',
}

export enum MediaPlayerActions {
  ClearTracks = 'media/player/clearTracks',
  AddTrack = 'media/player/addTrack',
  RemoveTrack = 'media/player/removeTrack',
  PlayTrack = 'media/player/playTrack',
  Play = 'media/player/play',
  Pause = 'media/player/pause',
  Stop = 'media/player/stop',
}

export enum MediaPlayerPlaybackState {
  Playing = 'media/player/playing',
  Paused = 'media/player/paused',
  Loading = 'media/player/loading',
  Idle = 'media/player/idle',
}

export enum MediaTrackLocationType {
  LocalFileSystem = 'media/track/location/localFS',
}

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
  LoadTrack = 'media/player/loadTrack',
  Play = 'media/player/play',
  PausePlayer = 'media/player/pausePlayer',
  StopPlayer = 'media/player/stopPlayer',
  UpdatePlaybackProgress = 'media/player/updatePlaybackProgress',
  UpdatePlaybackVolume = 'media/player/updatePlaybackVolume',
  MutePlaybackVolume = 'media/player/mutePlaybackVolume',
  UnmutePlaybackVolume = 'media/player/unmutePlaybackVolume',
}

export enum MediaPlayerPlaybackState {
  Playing = 'media/player/playing',
  Paused = 'media/player/paused',
  Loading = 'media/player/loading',
  Idle = 'media/player/idle',
}

export enum MediaTrackCoverPictureImageDataType {
  Buffer = 'media/track/coverPictureImageDataType/buffer',
}

export enum MediaProviderUpdateEvent {
  AddedProvider = 'media/provider/added',
}

export enum MediaLibraryUpdateEvent {
  AddedTrack = 'media/library/trackAdded',
}

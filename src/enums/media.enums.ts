export enum MediaFileExtensions {
  FLAC = 'flac',
  MP3 = 'mp3',
  M4A = 'm4a',
  WAV = 'wav',
}

export enum MediaLibraryActions {
  Initialize = 'media/library/initialize',
  InitializeSafe = 'media/library/initializeSafe',
  StartSync = 'media/library/startSync',
  FinishSync = 'media/library/finishSync',
  AddTrack = 'media/library/addTrack',
  RemoveTrack = 'media/library/removeTrack',
  AddAlbum = 'media/library/addAlbum',
  RemoveAlbum = 'media/library/removeAlbum',
  LoadAlbum = 'media/library/loadAlbum',
  AddArtist = 'media/library/addArtist',
  RemoveArtist = 'media/library/removeArtist',
  LoadArtist = 'media/library/loadArtist',
}

export enum MediaPlayerActions {
  ClearTracks = 'media/player/clearTracks',
  AddTrack = 'media/player/addTrack',
  RemoveTrack = 'media/player/removeTrack',
  LoadTrack = 'media/player/loadTrack',
  LoadExistingTrack = 'media/player/loadExistingTrack',
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

export enum MediaProviderRegistryActions {
  AddProvider = 'media/providerRegistry/addProvider',
  AddProviderSafe = 'media/providerRegistry/addProviderSafe',
}

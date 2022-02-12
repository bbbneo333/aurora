export enum MediaFileExtensions {
  FLAC = 'flac',
  MP3 = 'mp3',
  M4A = 'm4a',
  WAV = 'wav',
}

export enum MediaLibraryActions {
  Initialize = 'media/library/initialize',
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
  SetTrack = 'media/player/setTrack',
  SetTracks = 'media/player/setTracks',
  LoadTrack = 'media/player/loadTrack',
  LoadingTrack = 'media/player/loadingTrack',
  Play = 'media/player/play',
  PausePlayer = 'media/player/pausePlayer',
  StopPlayer = 'media/player/stopPlayer',
  UpdatePlaybackProgress = 'media/player/updatePlaybackProgress',
  UpdatePlaybackVolume = 'media/player/updatePlaybackVolume',
  MutePlaybackVolume = 'media/player/mutePlaybackVolume',
  UnmutePlaybackVolume = 'media/player/unmutePlaybackVolume',
  SetShuffle = 'media/player/setShuffle',
  SetRepeat = 'media/player/setRepeat',
}

export enum MediaPlaybackState {
  Loading = 'media/playback/loading',
  Playing = 'media/playback/playing',
  Paused = 'media/playback/paused',
  Stopped = 'media/playback/stopped',
  Ended = 'media/playback/ended',
}

export enum MediaPlaybackRepeatType {
  Track = 'media/playbackRepeat/track',
  Queue = 'media/playbackRepeat/queue',
}

export enum MediaTrackCoverPictureImageDataType {
  Buffer = 'media/track/coverPictureImageDataType/buffer',
  Path = 'media/track/coverPictureImageDataType/path',
}

export enum MediaProviderRegistryActions {
  AddProvider = 'media/providerRegistry/addProvider',
  AddProviderSafe = 'media/providerRegistry/addProviderSafe',
}

export enum IPCCommChannel {
  // these channels are used to send messages from renderer to main
  AppToggleWindowFill = 'app:toggle_window_fill',
  AppResetSettings = 'app:reset_settings',
  AppReadDetails = 'app:read_details',
  // file system (fs)
  FSReadAsset = 'fs:read_asset',
  FSSelectDirectory = 'fs:select_directory',
  FSSelectFile = 'fs:select_file',
  FSReadDirectory = 'fs:read_directory',
  FSReadFile = 'fs:read_file',
  // datastore (ds)
  DSCount = 'ds:count',
  DSRegisterDatastore = 'ds:register_datastore',
  DSFind = 'ds:find',
  DSFindOne = 'ds:find_one',
  DSInsertOne = 'ds:insert_one',
  DSUpdateOne = 'ds:update_one',
  DSRemoveOne = 'ds:remove_one',
  DSRemove = 'ds:remove',
  // crypto
  CryptoGenerateSHA256Hash = 'crypto:generate_sha_256_hash',
  // media
  MediaScaleAndCacheImage = 'media:scale_and_cache_image',
}

export enum IPCRendererCommChannel {
  // these channels are used to send messages from main to renderer
  // state
  StateRemovePersisted = 'state:remove_persisted',
  // ui
  UIOpenSettings = 'ui:open_settings',
}

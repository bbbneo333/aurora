export enum IPCCommChannels {
  // file system (fs)
  FSReadAsset = 'fs:read_asset',
  FSSelectDirectory = 'fs:select_directory',
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

export enum IPCRendererCommChannels {
  // state
  StateRemovePersisted = 'state:remove_persisted',
}

export enum Platforms {
  Darwin = 'darwin',
}

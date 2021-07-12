export enum IPCCommChannels {
  // file system (fs)
  FSReadAsset = 'fs:read_asset',
  FSSelectDirectory = 'fs:select_directory',
  FSReadDirectory = 'fs:read_directory',
  // datastore (ds)
  DSRegisterDatastore = 'ds:register_datastore',
  DSFind = 'ds:find',
  DSFindOne = 'ds:find_one',
  DSInsertOne = 'ds:insert_one',
  DSUpdateOne = 'ds:update_one',
  DSRemoveOne = 'ds:remove_one',
  DSRemove = 'ds:remove',
  // crypto
  CryptoGenerateSHA256Hash = 'crypto:generate_sha_256_hash',
}

export enum Platforms {
  Darwin = 'darwin',
}

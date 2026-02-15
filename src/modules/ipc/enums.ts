export enum IPCCommChannel {
  // these channels are used to send messages from renderer to main
  AppToggleWindowFill = 'app:toggle_window_fill',
  AppResetSettings = 'app:reset_settings',
  AppReadDetails = 'app:read_details',
  AppOpenMenu = 'app:open_menu',
  // file system (fs)
  FSReadAsset = 'fs:read_asset',
  FSSelectDirectory = 'fs:select_directory',
  FSSelectFile = 'fs:select_file',
  FSReadDirectoryStream = 'fs:read_directory_stream',
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
  DSUpsertOne = 'ds:upsert_one',
  // image
  ImageScale = 'image:scale',
}

export enum IPCRendererCommChannel {
  // these channels are used to send messages from main to renderer
  // state
  StateRemovePersisted = 'state:remove_persisted',
  // ui
  UIOpenSettings = 'ui:open_settings',
}

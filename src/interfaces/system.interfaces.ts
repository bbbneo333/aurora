export interface IFSAssetReadOptions {
  encoding?: 'utf8',
}

export interface IFSDirectoryReadOptions {
  fileExtensions?: string[],
}

export interface IFSDirectoryReadResponse {
  files: {
    path: string,
  }[]
  stats: {
    total_files_scanned: number;
    total_files_selected: number;
    total_time_taken: number;
  },
}

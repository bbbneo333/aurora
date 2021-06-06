export type FSAssetReadOptions = {
  encoding?: 'utf8',
};

export type FSDirectorySelectionOptions = {
  readFileExtensions?: string[],
};

export type FSDirectoryReadOptions = {
  fileExtensions?: string[],
};

export type FSDirectoryReadResponse = {
  files: {
    path: string,
  }[]
  stats: {
    total_files_scanned: number;
    total_files_selected: number;
    total_time_taken: number;
  },
};

export type FSDirectorySelectionResponse = {
  directory: string,
  directory_read: FSDirectoryReadResponse,
} | undefined;

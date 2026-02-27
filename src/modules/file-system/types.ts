export type FSReadAssetOptions = {
  encoding?: 'utf8';
};

export type FSReadDirectoryParams = {
  directory: string;
  fileExtensions?: string[];
};

export type FSFile = {
  path: string;
  name: string;
  stats?: {
    mtime?: number;
    size?: number;
  },
};

export type FSSelectFileOptions = {
  title?: string;
  extensions?: string[];
};

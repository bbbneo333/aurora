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
};

export type FSSelectFileOptions = {
  title?: string;
  extensions?: string[];
};

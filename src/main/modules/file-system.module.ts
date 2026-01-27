import fs from 'fs';
import { dialog } from 'electron';
import { walk } from '@nodelib/fs.walk';

import {
  IAppMain,
  IAppModule,
  IFSAssetReadOptions,
  IFSDirectoryReadOptions,
  IFSDirectoryReadResponse,
} from '../../interfaces';

import { IPCCommChannel } from '../../modules/ipc';

export class FileSystemModule implements IAppModule {
  private readonly app: IAppMain;

  constructor(app: IAppMain) {
    this.app = app;
    this.registerMessageHandlers();
  }

  private registerMessageHandlers() {
    this.app.registerSyncMessageHandler(IPCCommChannel.FSReadAsset, this.readAsset, this);
    this.app.registerAsyncMessageHandler(IPCCommChannel.FSReadDirectory, this.readDirectory, this);
    this.app.registerSyncMessageHandler(IPCCommChannel.FSReadFile, this.readFile, this);
    this.app.registerSyncMessageHandler(IPCCommChannel.FSSelectDirectory, this.selectDirectory, this);
    this.app.registerSyncMessageHandler(IPCCommChannel.FSSelectFile, this.selectFile, this);
  }

  private readAsset(fsAssetPath: string[], fsAssetReadOptions: IFSAssetReadOptions = {}) {
    const assetResourcePath = this.app.getAssetPath(...fsAssetPath);
    return fs.readFileSync(assetResourcePath, fsAssetReadOptions.encoding);
  }

  // @TODO: This needs to be improved. Not ideal for big libraries. Results should be streamable.
  private readDirectory(fsDirPath: string, fsDirReadOptions: IFSDirectoryReadOptions = {}): Promise<IFSDirectoryReadResponse> {
    const { fileExtensions } = fsDirReadOptions;
    const dirReadTimeStart = Date.now();

    return new Promise((resolve, reject) => {
      walk(fsDirPath, {
        followSymbolicLinks: false,
        stats: false,
        throwErrorOnBrokenSymbolicLink: false,
        entryFilter: (entry): boolean => {
          const { name } = entry;
          const i = name.lastIndexOf('.');
          if (i === -1) return false;

          return !fileExtensions || fileExtensions.includes(name.slice(i + 1).toLowerCase());
        },
        errorFilter: (error): boolean => {
          // we go silent on any error
          console.warn('Encountered error in readDirectory - %s', error.message);
          return true;
        },
      }, (error, entries) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            files: entries,
            stats: {
              total_files_scanned: entries.length,
              total_files_selected: entries.length,
              total_time_taken: Date.now() - dirReadTimeStart,
            },
          });
        }
      });
    });
  }

  private readFile(fsFilePath: string) {
    return fs.readFileSync(fsFilePath);
  }

  private selectDirectory(): string | undefined {
    // prompt user to select a directory, showOpenDialogSync will either return string[] or undefined (in case user cancels the operation)
    // important - this will only select a single directory (openDirectory will make sure only single directory is allowed to be selected)
    // @see - https://www.electronjs.org/docs/api/dialog#dialogshowopendialogsyncbrowserwindow-options
    const fsSelectedDirectories = dialog.showOpenDialogSync(this.app.getCurrentWindow(), {
      properties: ['openDirectory'],
    });

    return fsSelectedDirectories ? fsSelectedDirectories[0] : undefined;
  }

  private selectFile(options?: {
    title?: string;
    extensions?: string[];
  }) {
    const selection = dialog.showOpenDialogSync(this.app.getCurrentWindow(), {
      title: options?.title || 'Select file',
      properties: ['openFile'],
      filters: [{ name: 'Selection', extensions: options?.extensions || ['*'] }],
    });

    return selection?.[0];
  }
}

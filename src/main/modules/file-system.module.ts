import fs from 'fs';
import path from 'path';
import { dialog } from 'electron';

import { AppEnums } from '../../enums';

import {
  IAppMain,
  IAppModule,
  IFSAssetReadOptions,
  IFSDirectoryFile,
  IFSDirectoryReadOptions,
  IFSDirectoryReadResponse,
} from '../../interfaces';

export class FileSystemModule implements IAppModule {
  private readonly app: IAppMain;

  constructor(app: IAppMain) {
    this.app = app;
    this.registerMessageHandlers();
  }

  private registerMessageHandlers() {
    this.app.registerSyncMessageHandler(AppEnums.IPCCommChannels.FSReadAsset, this.readAsset, this);
    this.app.registerAsyncMessageHandler(AppEnums.IPCCommChannels.FSReadDirectory, this.readDirectory, this);
    this.app.registerSyncMessageHandler(AppEnums.IPCCommChannels.FSReadFile, this.readFile, this);
    this.app.registerSyncMessageHandler(AppEnums.IPCCommChannels.FSSelectDirectory, this.selectDirectory, this);
    this.app.registerSyncMessageHandler(AppEnums.IPCCommChannels.FSSelectFile, this.selectFile, this);
  }

  private readAsset(fsAssetPath: string[], fsAssetReadOptions: IFSAssetReadOptions = {}) {
    const assetResourcePath = this.app.getAssetPath(...fsAssetPath);
    return fs.readFileSync(assetResourcePath, fsAssetReadOptions.encoding);
  }

  private readDirectory(fsDirPath: string, fsDirReadOptions: IFSDirectoryReadOptions = {}): Promise<IFSDirectoryReadResponse> {
    const dirReadFiles: IFSDirectoryFile[] = [];
    const dirReadStats = {
      total_files_scanned: 0,
      total_files_selected: 0,
      total_time_taken: 0,
    };
    const dirReadTimeStart = Date.now();

    function readDirectoryItem(dir: string, done: Function) {
      fs.readdir(dir, (dirReadErr: Error | null, dirList: string[]) => {
        if (dirReadErr) {
          return done(dirReadErr);
        }

        let dirPointer = 0;

        return (function next(fileIterateErr?: Error): void {
          if (fileIterateErr) {
            return done(fileIterateErr);
          }

          let dirItem = dirList[dirPointer];
          dirPointer += 1;

          if (!dirItem) {
            // important - call DONE not NEXT, in order to signal end of dir
            return done(null);
          }
          dirItem = path.resolve(dir, dirItem);

          return fs.stat(dirItem, (dirStatErr: Error | null, dirStat) => {
            if (dirStatErr) {
              return done(dirStatErr);
            }
            if (dirStat && dirStat.isDirectory()) {
              return readDirectoryItem(dirItem, next);
            }

            // update stats (scanned)
            dirReadStats.total_files_scanned += 1;

            // skip file treatment if ignore by extensions
            // info - path.extname will extract out the extension from provided path: 'path/to/index.html' => .html
            // info - provided extensions do not have '.' prefix, handle accordingly
            // important - there can be cases where item does not have any extension (extname resolves to null), handle accordingly
            if (fsDirReadOptions.fileExtensions) {
              const dirItemExtension = (path.extname(dirItem) || '').slice(1);

              if (!fsDirReadOptions.fileExtensions.includes(dirItemExtension)) {
                return next();
              }
            }

            // update stats (selected)
            dirReadStats.total_files_selected += 1;

            // add file
            dirReadFiles.push({
              path: dirItem,
              name: path.basename(dirItem),
            });

            // continue iteration
            return next();
          });
        }());
      });
    }

    return new Promise((resolve, reject) => {
      readDirectoryItem(fsDirPath, (dirReadErr: Error) => {
        if (dirReadErr) {
          return reject(dirReadErr);
        }

        // update stats
        dirReadStats.total_time_taken = Date.now() - dirReadTimeStart;

        return resolve({
          files: dirReadFiles,
          stats: dirReadStats,
        });
      });
    });
  }

  private readFile(fsFilePath: string) {
    return fs.readFileSync(fsFilePath);
  }

  private selectDirectory(): string | undefined {
    // prompt user to select a directory, showOpenDialogSync will either returns string[] or undefined (in case user cancels the operation)
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

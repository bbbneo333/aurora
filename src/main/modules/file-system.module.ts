import fs from 'fs';
import path from 'path';
import {dialog} from 'electron';
import * as _ from 'lodash';

import {AppEnums} from '../../enums';
import {IAppMain, IAppModule} from '../../interfaces';

import {
  FSAssetReadOptions,
  FSDirectorySelectionOptions,
  FSDirectoryReadOptions,
  FSDirectoryReadResponse,
  FSDirectorySelectionResponse,
} from '../../types';

export class FileSystemModule implements IAppModule {
  private readonly app: IAppMain;

  constructor(app: IAppMain) {
    this.app = app;
    this.registerMessageHandlers();
  }

  private registerMessageHandlers() {
    this.app.registerSyncMessageHandler(AppEnums.IPCCommChannels.FSReadAsset, this.readAsset, this);
    this.app.registerAsyncMessageHandler(AppEnums.IPCCommChannels.FSSelectDirectory, this.selectDirectory, this);
  }

  private readAsset(fsAssetPath: string[], fsAssetReadOptions: FSAssetReadOptions = {}) {
    const assetResourcePath = this.app.getAssetPath(...fsAssetPath);
    return fs.readFileSync(assetResourcePath, fsAssetReadOptions.encoding);
  }

  private async selectDirectory(fsDirSelectionOptions: FSDirectorySelectionOptions = {}): Promise<FSDirectorySelectionResponse> {
    // prompt user to select a directory, in case user cancels the operation, procedure returns undefined
    // limitation - we only have support for reading a single directory for now (openDirectory will make sure only single directory is allowed to be selected)
    // @see - https://www.electronjs.org/docs/api/dialog#dialogshowopendialogsyncbrowserwindow-options
    const selectedDirectories = dialog.showOpenDialogSync(this.app.getCurrentWindow(), {
      properties: ['openDirectory'],
    });
    if (!selectedDirectories || _.isEmpty(selectedDirectories)) {
      return undefined;
    }

    // read the selected directory
    const selectedDirectoryRead = await this.readDirectory(selectedDirectories[0], {
      fileExtensions: fsDirSelectionOptions.readFileExtensions,
    });

    return {
      directory: selectedDirectories[0],
      directory_read: selectedDirectoryRead,
    };
  }

  private readDirectory(fsDirPath: string, fsDirReadOptions: FSDirectoryReadOptions = {}): Promise<FSDirectoryReadResponse> {
    const dirReadFiles: {
      path: string,
    }[] = [];
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
}

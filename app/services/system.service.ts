import {EventEmitter} from 'events';

import {SystemEnums} from '../enums';

const {remote} = window.require('electron');
const fs = remote.require('fs');
const path = remote.require('path');

interface FSStat {
  isDirectory(): Boolean;
}

interface FSDirReadOptions {
  fileExtensions?: string[];
}

export interface FSDirReadFileEventData {
  path: string;
}

export interface FSDirReadStats {
  totalFilesRead: number;
  totalFilesSelected: number;
  totalTimeTaken: number;
}

export class SystemService {
  /**
   * Reads file at provided path and parsed it using the utf8 encoding
   * Read happens synchronously
   *
   * @function readFile
   * @param {String} filePath
   * @returns {String}
   */
  readFile(filePath: string): string {
    return fs.readFileSync(filePath, 'utf8');
  }

  /**
   * Reads directory structure at provided path
   * Read happens asynchronously, interested links are emitted via EventEmitter
   *
   * @function readDirectory
   * @see https://www.npmjs.com/package/walk#getting-started
   * @param {String} dirPath
   * @param {Object} [dirReadOptions]
   * @returns {EventEmitter}
   */
  readDirectory(dirPath: string, dirReadOptions: FSDirReadOptions = {}): EventEmitter {
    const dirReadEmitter = new EventEmitter();
    const dirReadStats: FSDirReadStats = {
      totalFilesRead: 0,
      totalFilesSelected: 0,
      totalTimeTaken: 0,
    };
    const dirReadTimeStart = Date.now();

    function readDirectoryItem(dir: string, done: Function) {
      fs.readdir(dir, (dirReadErr: Error, dirList: string[]) => {
        if (dirReadErr) {
          return done(dirReadErr);
        }

        let dirPointer = 0;

        return (function next(fileIterateErr?: Error) {
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

          return fs.stat(dirItem, (dirStatErr: Error, dirStat: FSStat) => {
            if (dirStatErr) {
              return done(dirStatErr);
            }
            if (dirStat && dirStat.isDirectory()) {
              return readDirectoryItem(dirItem, next);
            }

            // update stats
            dirReadStats.totalFilesRead += 1;

            // skip file treatment if ignore by extensions
            // info - path.extname will extract out the extension from provided path: 'path/to/index.html' => .html
            if (dirReadOptions.fileExtensions && !dirReadOptions.fileExtensions.includes(path.extname(dirItem))) {
              return next();
            }

            // update stats
            dirReadStats.totalFilesSelected += 1;

            // prepare file event payload
            const fsDirReadFileEventData: FSDirReadFileEventData = {
              path: dirItem,
            };

            // emit event: file
            return dirReadEmitter.emit('file', fsDirReadFileEventData, next);
          });
        }());
      });
    }

    readDirectoryItem(dirPath, (dirReadErr: Error) => {
      if (dirReadErr) {
        dirReadEmitter.emit('error', dirReadErr);
        return;
      }

      // update stats
      dirReadStats.totalTimeTaken = Date.now() - dirReadTimeStart;

      // emit event: finished
      dirReadEmitter.emit('finished', dirReadStats);
    });

    return dirReadEmitter;
  }

  /**
   * Opens File/Directory selection system dialog
   * Supports following selection modes:
   * - File - For opening a single file
   * - Directory - For opening a single directory
   *
   * @function openSelectionDialog
   * @see https://www.electronjs.org/docs/api/dialog#dialogshowopendialogsyncbrowserwindow-options
   * @param {{selectionModes}} params
   * @returns {[String] | undefined}
   */
  openSelectionDialog(params: {
    selectionModes: [SystemEnums.DialogOpenModes];
  }): string[] | undefined {
    const currentWindow = remote.getCurrentWindow();
    return remote.dialog.showOpenDialogSync(currentWindow, {
      properties: params.selectionModes,
    });
  }
}

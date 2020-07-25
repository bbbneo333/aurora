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
    const emitter = new EventEmitter();
    const dirReadStats: FSDirReadStats = {
      totalFilesRead: 0,
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

          dirPointer += 1;
          let dirItem = dirList[dirPointer];
          if (!dirItem) {
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
            // skip file treatment if ignore by extensions
            // info - path.extname will extract out the extension from provided path: 'path/to/index.html' => .html
            if (dirReadOptions.fileExtensions && !dirReadOptions.fileExtensions.includes(path.extname(dirItem))) {
              return next();
            }
            // update stats
            dirReadStats.totalFilesRead += 1;
            // prepare prompt payload
            const fsDirReadFileEventData: FSDirReadFileEventData = {
              path: dirItem,
            };
            // handle prompt
            return emitter.emit('file', fsDirReadFileEventData, next);
          });
        }());
      });
    }

    readDirectoryItem(dirPath, (dirReadErr: Error) => {
      if (dirReadErr) {
        emitter.emit('error', dirReadErr);
        return;
      }
      // update / emit stats
      dirReadStats.totalTimeTaken = Date.now() - dirReadTimeStart;
      emitter.emit('finished', dirReadStats);
    });

    return emitter;
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

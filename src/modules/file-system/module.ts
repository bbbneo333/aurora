import fs from 'fs';
import { dialog } from 'electron';
import { Entry, walkStream } from '@nodelib/fs.walk';
import path from 'path';
import { isEmpty } from 'lodash';

import {
  IAppMain,
  IAppModule,
} from '../../interfaces';

import {
  FSFile,
  FSReadAssetOptions,
  FSReadDirectoryParams,
  FSSelectFileOptions,
} from './types';

import { IPCCommChannel, IPCMain, IPCStream } from '../ipc';

const debug = require('debug')('aurora:module:file-system');

export class FileSystemModule implements IAppModule {
  private readonly app: IAppMain;

  constructor(app: IAppMain) {
    this.app = app;
    this.registerMessageHandlers();
  }

  private registerMessageHandlers() {
    IPCMain.addSyncMessageHandler(IPCCommChannel.FSReadAsset, this.readAsset, this);
    IPCMain.addSyncMessageHandler(IPCCommChannel.FSReadDirectoryStream, this.readDirectoryStream, this);
    IPCMain.addSyncMessageHandler(IPCCommChannel.FSReadFile, this.readFile, this);
    IPCMain.addSyncMessageHandler(IPCCommChannel.FSSelectDirectory, this.selectDirectory, this);
    IPCMain.addSyncMessageHandler(IPCCommChannel.FSSelectFile, this.selectFile, this);
  }

  private readAsset(assetPath: string[], options?: FSReadAssetOptions) {
    const assetResourcePath = this.app.getAssetPath(...assetPath);
    return fs.readFileSync(assetResourcePath, options?.encoding);
  }

  private readDirectoryStream(eventId: string, params: FSReadDirectoryParams) {
    const { directory, fileExtensions } = params;
    const channels = IPCStream.composeChannels(IPCCommChannel.FSReadDirectoryStream, eventId);

    const batchSize = 100;
    let batch: FSFile[] = [];
    let finished = false;
    let abortListener: any;

    const sendBatch = () => {
      if (!batch.length) return;

      debug('readDirectoryStream - sending batch, eventId - %s, batchSize - %s', eventId, batch.length);
      this.app.sendMessageToRenderer(channels.data, { files: batch });
      batch = [];
    };

    const finalize = () => {
      if (finished) return;
      finished = true;

      debug('readDirectoryStream - finalizing, eventId - %s', eventId);

      sendBatch();
      this.app.sendMessageToRenderer(channels.complete);
      if (abortListener) IPCMain.removeMessageHandler(channels.abort, abortListener);
    };

    const entryFilter = (entry: Entry): boolean => {
      if (!entry.dirent.isFile()) return false;
      if (!fileExtensions || isEmpty(fileExtensions)) return true;

      const i = entry.name.lastIndexOf('.');
      if (i === -1) return false;

      const ext = entry.name.slice(i + 1).toLowerCase();
      return fileExtensions.includes(ext);
    };

    const walker = walkStream(directory, {
      followSymbolicLinks: false,
      stats: false,
      throwErrorOnBrokenSymbolicLink: false,
      entryFilter,
    });

    // stream
    walker
      .on('data', (entry: Entry) => {
        batch.push({
          path: entry.path,
          name: path.basename(entry.path),
        });

        if (batch.length >= batchSize) {
          sendBatch();
        }
      })
      .on('error', (err: Error) => {
        if (err.message !== 'Aborted') {
          this.app.sendMessageToRenderer(channels.error, err);
        }
      })
      .on('close', finalize)
      .on('end', finalize);

    // abort
    abortListener = () => {
      debug('readDirectoryStream - abort received - %s', eventId);
      walker.destroy(new Error('Aborted'));
    };

    IPCMain.addSyncMessageHandler(channels.abort, abortListener);
  }

  private readFile(filePath: string) {
    return fs.readFileSync(filePath);
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

  private selectFile(options?: FSSelectFileOptions) {
    const selection = dialog.showOpenDialogSync(this.app.getCurrentWindow(), {
      title: options?.title || 'Select file',
      properties: ['openFile'],
      filters: [{ name: 'Selection', extensions: options?.extensions || ['*'] }],
    });

    return selection?.[0];
  }
}

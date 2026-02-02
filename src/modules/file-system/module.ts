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

  private readDirectoryStream(params: FSReadDirectoryParams): string {
    const { directory, fileExtensions } = params;
    const channels = IPCStream.createChannels(IPCCommChannel.FSReadDirectoryStream);

    const entryFilter = (entry: Entry): boolean => {
      if (!entry.dirent.isFile()) return false;
      if (isEmpty(fileExtensions)) return true;

      const i = entry.name.lastIndexOf('.');
      if (i === -1) return false;

      const ext = entry.name.slice(i + 1).toLowerCase();
      return fileExtensions?.includes(ext) as boolean;
    };

    const sendBatch = (batch: FSFile[]) => {
      this.app.sendMessageToRenderer(channels.data, {
        files: batch,
      });
    };

    const walker = walkStream(directory, {
      followSymbolicLinks: false,
      stats: false,
      throwErrorOnBrokenSymbolicLink: false,
      entryFilter,
    });

    let batch: FSFile[] = [];
    const batchSize = 100;

    walker.on('data', (entry: Entry) => {
      batch.push({
        path: entry.path,
        name: path.basename(entry.path),
      });

      if (batch.length >= batchSize) {
        sendBatch(batch);
        batch = [];
      }
    });

    walker.on('error', (err: Error) => {
      console.error('Encountered error in readDirectory', err.message);
      this.app.sendMessageToRenderer(channels.error, err);
    });

    walker.on('end', () => {
      if (batch.length) sendBatch(batch);
      this.app.sendMessageToRenderer(channels.complete);
    });

    return channels.eventId;
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

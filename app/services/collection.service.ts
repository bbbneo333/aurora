import * as _ from 'lodash';

const debug = require('debug')('app:service:collection_service');

import {SystemService, FSDirReadFileEventData, FSDirReadStats} from './system.service';
import {SystemEnums, MediaEnums} from '../enums';
import {AudioMetadataUtils} from '../utils';

export class CollectionService {
  private readonly systemService: SystemService;

  constructor(ctx: {systemService: SystemService}) {
    this.systemService = ctx.systemService;
  }

  addTracks(): void {
    const selectedDirectories = this.systemService.openSelectionDialog({
      selectionModes: [SystemEnums.DialogOpenModes.Directory]
    });
    if (!selectedDirectories || _.isEmpty(selectedDirectories)) {
      return;
    }

    // openSelectionDialog responds back with a list of directories
    // we will be only processing the initial selection
    const selectedDirectory = selectedDirectories[0];
    const readDirectoryEmitter = this.systemService.readDirectory(selectedDirectory, {
      fileExtensions: [
        MediaEnums.AudioFileExtensions.MP3,
        MediaEnums.AudioFileExtensions.FLAC
      ]
    });

    readDirectoryEmitter.on('error', (error) => {
      debug('addTracks - encountered error');
      console.error(error);
    });

    readDirectoryEmitter.on('file', async (fsDirReadFileEventData: FSDirReadFileEventData, fsDirReadNext) => {
      debug('addTracks - found file - %s', fsDirReadFileEventData.path);
      // read metadata
      const audioMetadata = await AudioMetadataUtils.readMetadataFromFile(fsDirReadFileEventData.path);
      debug('addTracks - read file metadata - %s', audioMetadata.common.track);
      fsDirReadNext();
    });

    readDirectoryEmitter.on('finished', (fsDirReadStats: FSDirReadStats) => {
      debug('addTracks - finished processing');
      debug(fsDirReadStats);
    });
  }
}

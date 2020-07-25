import React from 'react';
import * as _ from 'lodash';
import {v4 as uuidv4} from 'uuid';

import {SystemService} from '../services';
import {MediaMetadataUtils} from '../utils';
import {IMediaItemManageAction, IMediaLibraryManager} from '../interfaces';
import {MediaEnums, SystemEnums} from '../enums';
import {FSDirReadFileEventData, FSDirReadStats} from '../services/system.service';

import {MediaItem} from './media-item';

const debug = require('debug')('app:common:media_library_manager');

export class MediaLibraryManager implements IMediaLibraryManager {
  private readonly systemService: SystemService;
  private readonly mediaItemManager: React.Dispatch<IMediaItemManageAction>;

  constructor(ctx: {
    systemService: SystemService,
    mediaItemManager: React.Dispatch<IMediaItemManageAction>,
  }) {
    this.systemService = ctx.systemService;
    this.mediaItemManager = ctx.mediaItemManager;
  }

  addTracksFromDirectory() {
    const selectedDirectories = this.systemService.openSelectionDialog({
      selectionModes: [SystemEnums.DialogOpenModes.Directory],
    });
    if (!selectedDirectories || _.isEmpty(selectedDirectories)) {
      return;
    }

    // openSelectionDialog responds back with a list of directories
    // we will be only processing the initial selection
    const selectedDirectory = selectedDirectories[0];
    const readDirectoryEmitter = this.systemService.readDirectory(selectedDirectory, {
      fileExtensions: [
        MediaEnums.MediaFileExtensions.MP3,
        MediaEnums.MediaFileExtensions.FLAC,
        MediaEnums.MediaFileExtensions.M4A,
      ],
    });

    readDirectoryEmitter.on('error', (error) => {
      debug('addTracks - encountered error');
      debug(error);
    });

    readDirectoryEmitter.on('file', async (fsDirReadFileEventData: FSDirReadFileEventData, fsDirReadNext) => {
      debug('addTracks - found file - %s', fsDirReadFileEventData.path);
      // read metadata
      const audioMetadata = await MediaMetadataUtils.readAudioMetadataFromFile(fsDirReadFileEventData.path);
      // update store
      this.mediaItemManager({
        type: MediaEnums.MediaLibraryActions.ADD_TRACK,
        data: new MediaItem({
          id: uuidv4(),
          track_name: audioMetadata.common.title || 'unknown track',
        }),
      });
      // proceed to next
      fsDirReadNext();
    });

    readDirectoryEmitter.on('finished', (fsDirReadStats: FSDirReadStats) => {
      debug('addTracks - finished processing');
      debug(fsDirReadStats);
    });
  }
}

import React, {createContext, useContext, useReducer} from 'react';
import * as _ from 'lodash';
import {v4 as uuidv4} from 'uuid';

import {IMediaItem, IMediaItemManageAction} from '../interfaces';
import {MediaEnums, SystemEnums} from '../enums';
import {MediaMetadataUtils} from '../utils';
import {mediaItemReducer} from '../reducers';
import {FSDirReadFileEventData, FSDirReadStats, SystemService} from '../services/system.service';
import {AppContext} from './app.context';

const debug = require('debug')('app:context:media_library_context');

class MediaLibraryManager {
  private readonly systemService: SystemService;
  private readonly mediaItemManage: React.Dispatch<IMediaItemManageAction>;

  constructor(ctx: {
    systemService: SystemService,
    mediaItemManage: React.Dispatch<IMediaItemManageAction>,
  }) {
    this.systemService = ctx.systemService;
    this.mediaItemManage = ctx.mediaItemManage;
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
      debug('addTracks - read file metadata - %s', JSON.stringify(audioMetadata.common));
      // update store
      this.mediaItemManage({
        type: MediaEnums.MediaLibraryActions.ADD_TRACK,
        data: {
          id: uuidv4(),
          track_name: audioMetadata.common.title || 'unknown track',
        },
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

export const MediaLibraryContext = createContext<{
  mediaLibraryManager: MediaLibraryManager,
  mediaItems: IMediaItem[],
} | null>(null);

export function MediaLibraryProvider(props: { children: React.ReactNode; }) {
  const {children} = props;
  const mediaItemStore: IMediaItem[] = [];
  const appContext = useContext(AppContext);
  const [mediaItems, mediaItemManage] = useReducer(mediaItemReducer, mediaItemStore);

  if (!appContext) {
    throw new Error('HomeComponent encountered error - Missing context - AppContext');
  }
  const {systemService} = appContext;

  const provider = {
    mediaItems,
    mediaLibraryManager: new MediaLibraryManager({
      systemService,
      mediaItemManage,
    }),
  };

  return (
    <MediaLibraryContext.Provider value={provider}>
      {children}
    </MediaLibraryContext.Provider>
  );
}

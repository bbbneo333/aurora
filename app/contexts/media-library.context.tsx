import React, {createContext, useContext, useReducer} from 'react';
import * as _ from 'lodash';
import {v4 as uuidv4} from 'uuid';

import {MediaEnums, SystemEnums} from '../enums';
import {IMediaItem, IMediaItemLibraryManageAction} from '../interfaces';
import {MediaItem} from '../models';
import {MediaService, SystemService} from '../services';
import {FSDirReadFileEventData, FSDirReadStats} from '../services/system.service';

import {AppContext} from './app.context';

const debug = require('debug')('app:context:media_library_context');

function mediaItemReducer(state: IMediaItem[], action: {
  type: MediaEnums.MediaLibraryActions,
  data?: any,
}): IMediaItem[] {
  switch (action.type) {
    case MediaEnums.MediaLibraryActions.ADD_TRACK:
      return [...state, action.data];
    case MediaEnums.MediaLibraryActions.REMOVE_TRACK:
      return _.filter(state, mediaItem => mediaItem.id !== action.data);
    default:
      return state;
  }
}

class MediaLibraryManager {
  private readonly mediaService: MediaService;
  private readonly systemService: SystemService;
  private readonly mediaItemManager: React.Dispatch<IMediaItemLibraryManageAction>;

  constructor(ctx: {
    mediaService: MediaService,
    systemService: SystemService,
    mediaItemManager: React.Dispatch<IMediaItemLibraryManageAction>,
  }) {
    this.mediaService = ctx.mediaService;
    this.systemService = ctx.systemService;
    this.mediaItemManager = ctx.mediaItemManager;
  }

  addDirectoryToLibrary(): void {
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
        MediaEnums.MediaFileExtensions.WAV,
      ],
    });

    readDirectoryEmitter.on('error', (error) => {
      debug('addTracksFromDirectory - encountered error');
      debug(error);
    });

    readDirectoryEmitter.on('file', async (fsDirReadFileEventData: FSDirReadFileEventData, fsDirReadNext) => {
      debug('addTracksFromDirectory - found file - %s', fsDirReadFileEventData.path);
      // read metadata
      const audioMetadata = await this.mediaService.readAudioMetadataFromFile(fsDirReadFileEventData.path);
      // update store
      this.mediaItemManager({
        type: MediaEnums.MediaLibraryActions.ADD_TRACK,
        data: new MediaItem({
          id: uuidv4(),
          track_name: audioMetadata.common.title || 'unknown track',
          location: {
            address: fsDirReadFileEventData.path,
            type: MediaEnums.MediaItemLocationType.LocalFileSystem,
          },
        }),
      });
      // proceed to next
      fsDirReadNext();
    });

    readDirectoryEmitter.on('finished', (fsDirReadStats: FSDirReadStats) => {
      debug('addTracksFromDirectory - finished processing');
      debug(fsDirReadStats);
    });
  }

  removeMediaItemFromLibrary(mediaItem: IMediaItem): void {
    this.mediaItemManager({
      type: MediaEnums.MediaLibraryActions.REMOVE_TRACK,
      data: mediaItem.id,
    });
  }
}

export const MediaLibraryContext = createContext<{
  mediaItems: IMediaItem[],
  mediaLibraryManager: MediaLibraryManager,
} | null>(null);

export function MediaLibraryProvider(props: { children: React.ReactNode; }) {
  const {children} = props;
  const mediaItemStore: IMediaItem[] = [];
  const appContext = useContext(AppContext);
  const [mediaItems, mediaItemManager] = useReducer(mediaItemReducer, mediaItemStore);

  if (!appContext) {
    throw new Error('MediaLibraryProvider encountered error - Missing context - AppContext');
  }
  const {
    mediaService,
    systemService,
  } = appContext;

  const mediaLibraryManager = new MediaLibraryManager({
    mediaService,
    systemService,
    mediaItemManager,
  });

  const provider = {
    mediaItems,
    mediaLibraryManager,
  };

  return (
    <MediaLibraryContext.Provider value={provider}>
      {children}
    </MediaLibraryContext.Provider>
  );
}

import React, {createContext, useContext, useReducer} from 'react';
import * as _ from 'lodash';
import {v4 as uuidv4} from 'uuid';

import {IMediaItem} from '../interfaces';
import {MediaEnums, SystemEnums} from '../enums';
import {mediaItemReducer} from '../reducers';
import {MediaMetadataUtils} from '../utils';
import {FSDirReadFileEventData, FSDirReadStats} from '../services/system.service';
import {AppContext} from './app.context';

const debug = require('debug')('app:context:media_library_context');

const mediaItemStore: IMediaItem[] = [];

export const MediaLibraryContext = createContext<{
  mediaItems: IMediaItem[],
  mediaLibraryManager: {
    addTracksFromDirectory(): void,
  }
} | null>(null);

export function MediaLibraryProvider(props: { children: React.ReactNode; }) {
  const {children} = props;
  const appContext = useContext(AppContext);
  const [mediaItems, mediaItemManage] = useReducer(mediaItemReducer, mediaItemStore);

  if (!appContext) {
    throw new Error('HomeComponent encountered error - Missing context - AppContext');
  }
  const {systemService} = appContext;

  const provider = {
    mediaItems,
    mediaLibraryManager: {
      addTracksFromDirectory() {
        const selectedDirectories = systemService.openSelectionDialog({
          selectionModes: [SystemEnums.DialogOpenModes.Directory],
        });
        if (!selectedDirectories || _.isEmpty(selectedDirectories)) {
          return;
        }

        // openSelectionDialog responds back with a list of directories
        // we will be only processing the initial selection
        const selectedDirectory = selectedDirectories[0];
        const readDirectoryEmitter = systemService.readDirectory(selectedDirectory, {
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
          // add item to store
          mediaItemManage({
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
      },
    },
  };

  return (
    <MediaLibraryContext.Provider value={provider}>
      {children}
    </MediaLibraryContext.Provider>
  );
}

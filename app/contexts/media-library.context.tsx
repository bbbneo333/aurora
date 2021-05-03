import React, {createContext, useContext} from 'react';
import {useDispatch} from 'react-redux';
import * as _ from 'lodash';
import {v4 as uuidv4} from 'uuid';

import {MediaEnums, SystemEnums} from '../enums';
import {MediaTrack} from '../models';
import {FSDirReadFileEventData, FSDirReadStats} from '../services/system.service';

import {AppContext} from './app.context';

const debug = require('debug')('app:context:media_library_context');

export type MediaLibraryManager = {
  addDirectoryToLibrary(): void;
  removeMediaTrackFromLibrary(mediaTrack: MediaTrack): void;
};

export const MediaLibraryContext = createContext<{
  mediaLibraryManager: MediaLibraryManager,
} | null>(null);

export function MediaLibraryProvider(props: { children: React.ReactNode; }) {
  const {children} = props;
  const appContext = useContext(AppContext);
  const dispatch = useDispatch();

  if (!appContext) {
    throw new Error('MediaLibraryProvider encountered error - Missing context - AppContext');
  }

  const {
    mediaService,
    systemService,
  } = appContext;

  const mediaLibraryManager: MediaLibraryManager = {
    addDirectoryToLibrary(): void {
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
        const audioMetadata = await mediaService.readAudioMetadataFromFile(fsDirReadFileEventData.path);
        // update store
        dispatch({
          type: MediaEnums.MediaLibraryActions.AddTrack,
          data: {
            mediaTrack: new MediaTrack({
              id: uuidv4(),
              track_name: audioMetadata.common.title || 'unknown track',
              location: {
                address: fsDirReadFileEventData.path,
                type: MediaEnums.MediaTrackLocationType.LocalFileSystem,
              },
            }),
          },
        });
        // proceed to next
        fsDirReadNext();
      });

      readDirectoryEmitter.on('finished', (fsDirReadStats: FSDirReadStats) => {
        debug('addTracksFromDirectory - finished processing');
        debug(fsDirReadStats);
      });
    },
    removeMediaTrackFromLibrary(mediaTrack: MediaTrack): void {
      dispatch({
        type: MediaEnums.MediaLibraryActions.RemoveTrack,
        data: {
          mediaTrackId: mediaTrack.id,
        },
      });
    },
  };

  const provider = {
    mediaLibraryManager,
  };

  return (
    <MediaLibraryContext.Provider value={provider}>
      {children}
    </MediaLibraryContext.Provider>
  );
}

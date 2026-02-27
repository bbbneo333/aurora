import _ from 'lodash';
import { createStore } from 'redux';

import { IMediaLocalSettings } from './media-local.interfaces';

export enum MediaLocalStateActionType {
  SettingsLoad = 'mediaLocalSettings/settingsLoad',
  SettingsLoaded = 'mediaLocalSettings/settingsLoaded',
  SettingsSave = 'mediaLocalSettings/settingsSave',
  SettingsSaved = 'mediaLocalSettings/settingsSaved',
  AddDirectory = 'mediaLocalSettings/addDirectory',
  RemoveDirectory = 'mediaLocalSettings/removeDirectory',
  StartSync = 'mediaLocalSettings/startSync',
  FinishSync = 'mediaLocalSettings/finishSync',
  IncrementDirectorySyncFilesFound = 'mediaLocalSettings/incrementDirectorySyncFilesFound',
  IncrementDirectorySyncFilesProcessed = 'mediaLocalSettings/incrementDirectorySyncFilesProcessed',
  IncrementDirectorySyncFilesAdded = 'mediaLocalSettings/incrementDirectorySyncFilesAdded',
  SetDirectorySyncError = 'mediaLocalSettings/setDirectorySyncError',
}

export type MediaSyncDirectoryStats = {
  error?: string,
  filesFound?: number,
  filesProcessed?: number,
  filesAdded?: number,
};

export type MediaLocalState = {
  settings: IMediaLocalSettings,
  dirty: boolean,
  loading: boolean,
  loaded: boolean,
  saving: boolean,
  saved: boolean,
  syncing: boolean,
  syncDuration: number, // in ms
  syncFilesFoundCount: number, // files reported by scan
  syncFilesProcessedCount: number, // files processes excluding error
  syncFilesAddedCount: number, // new or updated file count, files older than mtime are skipped
  syncDirectoryStats: Record<string, MediaSyncDirectoryStats>,
};

export type MediaLocalStateAction = {
  type: MediaLocalStateActionType,
  data?: any,
};

const mediaLocalInitialState: MediaLocalState = {
  settings: {
    library: {
      directories: [],
    },
  },
  dirty: false,
  loading: false,
  loaded: false,
  saving: false,
  saved: false,
  syncing: false,
  syncDuration: 0,
  syncFilesProcessedCount: 0,
  syncFilesFoundCount: 0,
  syncFilesAddedCount: 0,
  syncDirectoryStats: {},
};

function mediaLocalStateReducer(state: MediaLocalState = mediaLocalInitialState, action: MediaLocalStateAction): MediaLocalState {
  switch (action.type) {
    case MediaLocalStateActionType.SettingsLoad: {
      return {
        ...state,
        loading: true,
        loaded: false,
      };
    }
    case MediaLocalStateActionType.SettingsLoaded: {
      // data.settings - loaded settings
      return {
        ...state,
        settings: action.data.settings,
        loading: false,
        loaded: true,
      };
    }
    case MediaLocalStateActionType.SettingsSave: {
      return {
        ...state,
        saving: true,
      };
    }
    case MediaLocalStateActionType.SettingsSaved: {
      return {
        ...state,
        dirty: false,
        saving: false,
        saved: true,
      };
    }
    case MediaLocalStateActionType.AddDirectory: {
      // data.selectedDirectory - directory which needs to be added
      const { selectedDirectory } = action.data;
      const directories = state.settings ? state.settings.library.directories : [];
      let directoriesAreUpdated = false;

      // added directory to be treated as new if:
      // - does not already exist
      // - or, had error in previous sync
      if (!directories.includes(selectedDirectory)) {
        directories.push(selectedDirectory);
        directoriesAreUpdated = true;
      } else if (!_.isEmpty(state.syncDirectoryStats[selectedDirectory]?.error)) {
        directoriesAreUpdated = true;
      }

      return {
        ...state,
        settings: {
          library: {
            directories,
          },
        },
        dirty: directoriesAreUpdated,
      };
    }
    case MediaLocalStateActionType.RemoveDirectory: {
      // data.directory - directory which needs to be removed
      const { directory } = action.data;
      const directories = state.settings ? state.settings.library.directories : [];
      let directoriesAreUpdated = false;

      if (directories.includes(directory)) {
        // important - pull will mutate the original array
        _.pull(directories, directory);
        directoriesAreUpdated = true;
      }

      return {
        ...state,
        settings: {
          library: {
            directories,
          },
        },
        dirty: directoriesAreUpdated,
      };
    }
    case MediaLocalStateActionType.StartSync: {
      return {
        ...state,
        syncing: true,
        syncDuration: 0,
        syncFilesFoundCount: 0,
        syncFilesProcessedCount: 0,
        syncDirectoryStats: {},
      };
    }
    case MediaLocalStateActionType.FinishSync: {
      // data.syncDuration - duration in ms
      const { syncDuration = 0 } = action.data;

      return {
        ...state,
        syncing: false,
        syncDuration,
      };
    }
    case MediaLocalStateActionType.SetDirectorySyncError: {
      // data.directory - string
      // data.error - string
      const { directory, error } = action.data;

      return {
        ...state,
        syncDirectoryStats: {
          ...state.syncDirectoryStats,
          [directory]: {
            ...(state.syncDirectoryStats[directory] || {}),
            error,
          },
        },
      };
    }
    case MediaLocalStateActionType.IncrementDirectorySyncFilesFound: {
      // data.directory - string
      // data.count - number
      const { directory, count } = action.data;
      const dirCount = (state.syncDirectoryStats[directory]?.filesFound || 0) + count;
      const totalCount = state.syncFilesFoundCount + count;

      return {
        ...state,
        syncFilesFoundCount: totalCount,
        syncDirectoryStats: {
          ...state.syncDirectoryStats,
          [directory]: {
            ...(state.syncDirectoryStats[directory] || {}),
            filesFound: dirCount,
          },
        },
      };
    }
    case MediaLocalStateActionType.IncrementDirectorySyncFilesProcessed: {
      // data.directory - string
      // data.count - number
      const { directory, count } = action.data;
      const dirCount = (state.syncDirectoryStats[directory]?.filesProcessed || 0) + count;
      const totalCount = state.syncFilesProcessedCount + count;

      return {
        ...state,
        syncFilesProcessedCount: totalCount,
        syncDirectoryStats: {
          ...state.syncDirectoryStats,
          [directory]: {
            ...(state.syncDirectoryStats[directory] || {}),
            filesProcessed: dirCount,
          },
        },
      };
    }
    case MediaLocalStateActionType.IncrementDirectorySyncFilesAdded: {
      // data.directory - string
      // data.count - number
      const { directory, count } = action.data;
      const dirCount = (state.syncDirectoryStats[directory]?.filesAdded || 0) + count;
      const totalCount = state.syncFilesAddedCount + count;

      return {
        ...state,
        syncFilesAddedCount: totalCount,
        syncDirectoryStats: {
          ...state.syncDirectoryStats,
          [directory]: {
            ...(state.syncDirectoryStats[directory] || {}),
            filesAdded: dirCount,
          },
        },
      };
    }
    default:
      return state;
  }
}

export const mediaLocalStore = createStore(mediaLocalStateReducer);

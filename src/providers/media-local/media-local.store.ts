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
}

export type MediaLocalState = {
  settings: IMediaLocalSettings,
  dirty: boolean,
  loading: boolean,
  loaded: boolean,
  saving: boolean,
  saved: boolean,
  syncing: boolean,
  syncDuration: number, // in ms
  syncFileCount: number,
};

export type MediaLocalStateAction = {
  type: MediaLocalStateActionType,
  data?: any;
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
  syncFileCount: 0,
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

      if (!directories.includes(selectedDirectory)) {
        directories.push(selectedDirectory);
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
        syncFileCount: 0,
      };
    }
    case MediaLocalStateActionType.FinishSync: {
      // data.syncDuration - duration in ms
      // data.syncFileCount - file count
      const { syncDuration = 0, syncFileCount = 0 } = action.data;

      return {
        ...state,
        syncing: false,
        syncDuration,
        syncFileCount,
      };
    }
    default:
      return state;
  }
}

export const mediaLocalStore = createStore(mediaLocalStateReducer);

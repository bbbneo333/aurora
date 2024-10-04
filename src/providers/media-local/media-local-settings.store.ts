import _ from 'lodash';

import { IMediaLocalSettings } from './media-local.interfaces';

export enum MediaLocalSettingsStateActionType {
  SettingsLoad = 'mediaLocalSettings/settingsLoad',
  SettingsLoaded = 'mediaLocalSettings/settingsLoaded',
  SettingsSave = 'mediaLocalSettings/settingsSave',
  SettingsSaved = 'mediaLocalSettings/settingsSaved',
  AddDirectory = 'mediaLocalSettings/addDirectory',
  RemoveDirectory = 'mediaLocalSettings/removeDirectory',
}

export type MediaLocalSettingsState = {
  settings: IMediaLocalSettings | undefined,
  dirty: boolean,
  loading: boolean,
  loaded: boolean,
  saving: boolean,
  saved: boolean,
};

export type MediaLocalSettingsStateAction = {
  type: MediaLocalSettingsStateActionType,
  data?: any;
};

export function mediaLocalSettingsStateReducer(state: MediaLocalSettingsState, action: MediaLocalSettingsStateAction): MediaLocalSettingsState {
  switch (action.type) {
    case MediaLocalSettingsStateActionType.SettingsLoad: {
      return {
        ...state,
        settings: undefined,
        loading: true,
        loaded: false,
      };
    }
    case MediaLocalSettingsStateActionType.SettingsLoaded: {
      // data.settings - loaded settings
      return {
        ...state,
        settings: action.data.settings,
        loading: false,
        loaded: true,
      };
    }
    case MediaLocalSettingsStateActionType.SettingsSave: {
      return {
        ...state,
        saving: true,
      };
    }
    case MediaLocalSettingsStateActionType.SettingsSaved: {
      return {
        ...state,
        dirty: false,
        saving: false,
        saved: true,
      };
    }
    case MediaLocalSettingsStateActionType.AddDirectory: {
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
    case MediaLocalSettingsStateActionType.RemoveDirectory: {
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
    default:
      return state;
  }
}

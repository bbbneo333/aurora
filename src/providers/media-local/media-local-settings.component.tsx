import React, {useEffect, useReducer} from 'react';
import * as _ from 'lodash';

import {AppEnums} from '../../enums';
import {AppService, MediaProviderService} from '../../services';

import {IMediaLocalSettings} from './media-local.interfaces';
import MediaLocalConstants from './media-local.constants.json';

enum MediaLocalSettingsStateActionType {
  SettingsLoad = 'mediaLocalSettings/settingsLoad',
  SettingsLoaded = 'mediaLocalSettings/settingsLoaded',
  SettingsSave = 'mediaLocalSettings/settingsSave',
  SettingsSaved = 'mediaLocalSettings/settingsSaved',
  AddDirectory = 'mediaLocalSettings/addDirectory',
  RemoveDirectory = 'mediaLocalSettings/removeDirectory',
}

type MediaLocalSettingsState = {
  settings: IMediaLocalSettings | undefined,
  dirty: boolean,
  loading: boolean,
  loaded: boolean,
  saving: boolean,
  saved: boolean,
};

type MediaLocalSettingsStateAction = {
  type: MediaLocalSettingsStateActionType,
  data?: any;
};

function mediaLocalSettingsStateReducer(state: MediaLocalSettingsState, action: MediaLocalSettingsStateAction): MediaLocalSettingsState {
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
      const {selectedDirectory} = action.data;
      const directories = state.settings ? state.settings.library.directories : [];

      if (!directories.includes(selectedDirectory)) {
        directories.push(selectedDirectory);
      }

      return {
        ...state,
        settings: {
          library: {
            directories,
          },
        },
        dirty: true,
      };
    }
    case MediaLocalSettingsStateActionType.RemoveDirectory: {
      // data.directory - directory which needs to be removed
      const {directory} = action.data;
      const directories = state.settings ? state.settings.library.directories : [];

      if (directories.includes(directory)) {
        // important - pull will mutate the original array
        _.pull(directories, directory);
      }

      return {
        ...state,
        settings: {
          library: {
            directories,
          },
        },
        dirty: true,
      };
    }
    default:
      return state;
  }
}

function openDirectorySelectionDialog(): string | undefined {
  return AppService.sendSyncMessage(AppEnums.IPCCommChannels.FSSelectDirectory);
}

export function MediaLocalSettingsComponent() {
  const [{
    settings,
    dirty,
    loading,
    saving,
    saved,
  }, mediaLocalSettingsDispatch] = useReducer(mediaLocalSettingsStateReducer, {
    settings: undefined,
    dirty: false,
    loading: false,
    loaded: false,
    saving: false,
    saved: false,
  });

  useEffect(() => {
    mediaLocalSettingsDispatch({
      type: MediaLocalSettingsStateActionType.SettingsLoad,
    });

    MediaProviderService
      .getMediaProviderSettings(MediaLocalConstants.Provider)
      .then((mediaSettings) => {
        mediaLocalSettingsDispatch({
          type: MediaLocalSettingsStateActionType.SettingsLoaded,
          data: {
            settings: mediaSettings,
          },
        });
      });
  }, []);

  useEffect(() => {
    if (!settings || !dirty) {
      return;
    }

    mediaLocalSettingsDispatch({
      type: MediaLocalSettingsStateActionType.SettingsSave,
    });

    MediaProviderService
      .updateMediaProviderSettings(MediaLocalConstants.Provider, settings)
      .then(() => {
        mediaLocalSettingsDispatch({
          type: MediaLocalSettingsStateActionType.SettingsSaved,
        });
      });
  }, [
    settings,
  ]);

  if (loading) {
    return (
      <div>
        Loading Settings
      </div>
    );
  }

  if (!settings) {
    return (
      <div>
        No setting were found
      </div>
    );
  }

  if (saving) {
    return (
      <div>
        Saving Settings
      </div>
    );
  }

  return (
    <div>
      These are Local Provider settings
      <br/>
      <div>
        Selected Directories:
        <br/>
        {settings.library.directories.map(directory => (
          <div key={directory}>
            <span>{directory}</span>
            <button
              type="submit"
              onClick={() => {
                mediaLocalSettingsDispatch({
                  type: MediaLocalSettingsStateActionType.RemoveDirectory,
                  data: {
                    directory,
                  },
                });
              }}
            >
              Remove Directory
            </button>
            <br/>
          </div>
        ))}

        <button
          type="submit"
          onClick={() => {
            const selectedDirectory = openDirectorySelectionDialog();
            if (selectedDirectory) {
              mediaLocalSettingsDispatch({
                type: MediaLocalSettingsStateActionType.AddDirectory,
                data: {
                  selectedDirectory,
                },
              });
            }
          }}
        >
          Add Directory
        </button>
      </div>
      {saved && <div>Settings were saved successfully!</div>}
    </div>
  );
}

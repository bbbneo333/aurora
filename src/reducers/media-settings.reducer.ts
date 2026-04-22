import { GithubReleaseInfo } from '../modules/github';

import { Settings, SettingsActions } from '../types';

export type SettingsState = {
  settings: Settings;
  loading: boolean;
  saving: boolean;
  updateCheckInProgress: boolean;
  updateLatestRelease?: GithubReleaseInfo;
  updateAvailable: boolean;
};

export type MediaSettingsStateAction = {
  type: SettingsActions,
  data?: any,
};

const mediaSettingsInitialState: SettingsState = {
  settings: {
    updates_auto_check: false,
    updates_prerelease: false,
  },
  loading: false,
  saving: false,
  updateCheckInProgress: false,
  updateLatestRelease: undefined,
  updateAvailable: false,
};

export default (state: SettingsState = mediaSettingsInitialState, action: MediaSettingsStateAction): SettingsState => {
  switch (action.type) {
    case SettingsActions.LoadSettings: {
      const { data } = action;

      return {
        ...state,
        settings: data,
      };
    }
    case SettingsActions.LoadingRelease: {
      return {
        ...state,
        updateCheckInProgress: true,
      };
    }
    case SettingsActions.LoadedRelease: {
      const { data } = action;
      const { latestRelease, isUpdateAvailable } = data;

      return {
        ...state,
        updateCheckInProgress: false,
        updateLatestRelease: latestRelease,
        updateAvailable: isUpdateAvailable,
      };
    }
    default:
      return state;
  }
};

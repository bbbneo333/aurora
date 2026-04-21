import { Settings, SettingsActions } from '../types';

export type SettingsState = {
  settings: Settings;
  loading: boolean;
  saving: boolean;
  updateCheckInProgress: boolean;
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
    default:
      return state;
  }
};

export enum SettingsActions {
  LoadSettings = 'loadSettings',
  LoadingRelease = 'loadingRelease',
  LoadedRelease = 'loadedRelease',
}

export type Settings = {
  updates_auto_check: boolean;
  updates_prerelease: boolean;
};

export const SettingsSchema = {
  updates_auto_check: {
    type: 'boolean',
    default: false,
  },
  updates_prerelease: {
    type: 'boolean',
    default: false,
  },
};

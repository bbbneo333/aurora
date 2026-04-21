import { IPCCommChannel, IPCRenderer } from '../modules/ipc';

import { Settings, SettingsActions, SettingsSchema } from '../types';
import store from '../store';

export class SettingsService {
  private static readonly settingsStoreName = 'settings';

  static loadSettings() {
    store.dispatch({
      type: SettingsActions.LoadSettings,
      data: this.readSettings(),
    });
  }

  static toggleAutoUpdateCheck() {
    const settings = this.writeSetting('updates_auto_check', !this.readSettings().updates_auto_check);

    store.dispatch({
      type: SettingsActions.LoadSettings,
      data: settings,
    });
  }

  static togglePreRelease() {
    const settings = this.writeSetting('updates_prerelease', !this.readSettings().updates_prerelease);

    store.dispatch({
      type: SettingsActions.LoadSettings,
      data: settings,
    });
  }

  static checkForUpdates() {
  }

  private static readSettings(): Settings {
    return IPCRenderer.sendSyncMessage(IPCCommChannel.StoreRead, this.settingsStoreName, {
      schema: SettingsSchema,
    });
  }

  private static writeSetting(key: keyof Settings, value: any): Settings {
    return IPCRenderer.sendSyncMessage(IPCCommChannel.StoreWriteKey, this.settingsStoreName, key, value);
  }
}

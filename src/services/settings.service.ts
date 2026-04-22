import { IPCCommChannel, IPCRenderer } from '../modules/ipc';
import { GithubReleaseInfo, GithubService } from '../modules/github';

import { Settings, SettingsActions, SettingsSchema } from '../types';
import { Links } from '../constants';
import { NotificationService } from './notification.service';
import { I18nService } from './i18n.service';
import { VersionUtils } from '../utils';
import store from '../store';

import { AppService } from './app.service';

const debug = require('debug')('aurora:service:settings');

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

  static async checkForUpdates() {
    store.dispatch({
      type: SettingsActions.LoadingRelease,
    });

    let latestRelease: GithubReleaseInfo | undefined;
    let isUpdateAvailable: boolean = false;

    try {
      const release = await this.getLatestRelease();

      if (release) {
        latestRelease = release;
        isUpdateAvailable = VersionUtils.isGreater(AppService.details.version, latestRelease.version);

        debug(
          'fetched latest release - installed version - %s, fetched version - %s, available? - %s',
          AppService.details.version,
          latestRelease.version,
          isUpdateAvailable,
        );
      }
    } catch (error: any) {
      NotificationService.showMessage(I18nService.getString('message_update_check_error', {
        error: error.message,
      }));
    } finally {
      store.dispatch({
        type: SettingsActions.LoadedRelease,
        data: {
          latestRelease,
          isUpdateAvailable,
        },
      });
    }
  }

  private static readSettings(): Settings {
    return IPCRenderer.sendSyncMessage(IPCCommChannel.StoreRead, this.settingsStoreName, {
      schema: SettingsSchema,
    });
  }

  private static writeSetting(key: keyof Settings, value: any): Settings {
    return IPCRenderer.sendSyncMessage(IPCCommChannel.StoreWriteKey, this.settingsStoreName, key, value);
  }

  private static async getLatestRelease(): Promise<GithubReleaseInfo | null> {
    const settings = this.readSettings();
    let latestRelease = await GithubService.getLatestStableRelease(Links.ProjectRepository);

    if (settings.updates_prerelease) {
      const latestPreRelease = await GithubService.getLatestPreRelease(Links.ProjectRepository);

      if (
        latestPreRelease
        && (!latestRelease || VersionUtils.isGreater(latestRelease.version, latestPreRelease.version))
      ) {
        latestRelease = latestPreRelease;
      }
    }

    return latestRelease;
  }
}

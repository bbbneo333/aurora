import LocalizedStrings, {LocalizedStringsMethods} from 'react-localization';

import {AppEnums} from '../enums';
import AppService from './app.service';

class I18nService {
  private readonly localeAssetPath = 'locales';
  private readonly localeDefault = 'en';
  private readonly localeStrings: LocalizedStringsMethods;

  constructor() {
    const localeAssets: any = {};
    localeAssets[this.localeDefault] = this.getLocaleFile(this.localeDefault);
    this.localeStrings = new LocalizedStrings(localeAssets);
  }

  getString(key: string): string {
    // @ts-ignore
    return this.localeStrings.formatString(this.localeStrings[key]) as string;
  }

  private getLocaleFile(locale: string): object {
    const localeRaw = AppService.sendSyncMessage(AppEnums.IPCCommChannels.FSReadAsset, [this.localeAssetPath, `${locale}.json`], {
      encoding: 'utf8',
    });
    return JSON.parse(localeRaw);
  }
}

export default new I18nService();

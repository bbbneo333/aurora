import LocalizedStrings, { LocalizedStringsMethods } from 'react-localization';

import { AppEnums } from '../enums';
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

  getString(key: string, values?: Record<string, string | JSX.Element>): string {
    // values can be named object for string substitution
    // @see - https://www.npmjs.com/package/react-localization#api
    // @ts-ignore
    return this.localeStrings.formatString(this.localeStrings[key], values) as string;
  }

  private getLocaleFile(locale: string): object {
    const localeRaw = AppService.sendSyncMessage(AppEnums.IPCCommChannels.FSReadAsset, [this.localeAssetPath, `${locale}.json`], {
      encoding: 'utf8',
    });
    return JSON.parse(localeRaw);
  }
}

export default new I18nService();

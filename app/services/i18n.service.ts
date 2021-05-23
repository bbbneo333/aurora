/* eslint-disable @typescript-eslint/ban-ts-ignore, @typescript-eslint/no-explicit-any */

import LocalizedStrings, {LocalizedStringsMethods} from 'react-localization';

import SystemService from './system.service';

class I18nService {
  private readonly localeAssetPath = 'resources/locales';
  private readonly localeAssetFormat = 'json';
  private readonly localeDefault = 'en';
  private readonly localeStrings: LocalizedStringsMethods;

  constructor() {
    // get locale asset
    const localeDefaultAssetPath = `${this.localeAssetPath}/${this.localeDefault}.${this.localeAssetFormat}`;
    const localeAssets: any = {};
    localeAssets[this.localeDefault] = JSON.parse(
      SystemService.readFile(localeDefaultAssetPath),
    );
    this.localeStrings = new LocalizedStrings(localeAssets);
  }

  getString(key: string): string {
    // @ts-ignore
    return this.localeStrings.formatString(this.localeStrings[key]) as string;
  }
}

export default new I18nService();

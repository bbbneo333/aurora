/* eslint-disable @typescript-eslint/ban-ts-ignore, @typescript-eslint/no-explicit-any */

import LocalizedStrings, {LocalizedStringsMethods} from 'react-localization';

import {SystemService} from './system.service';

export class I18nService {
  private readonly localeAssetPath = 'resources/locales';
  private readonly localeAssetFormat = 'json';
  private readonly localeDefault = 'en';
  private readonly localeStrings: LocalizedStringsMethods;

  constructor(ctx: {systemService: SystemService}) {
    // get locale asset
    const localeDefaultAssetPath = `${this.localeAssetPath}/${this.localeDefault}.${this.localeAssetFormat}`;
    const localeAssets: any = {};
    localeAssets[this.localeDefault] = JSON.parse(
      ctx.systemService.getFile(localeDefaultAssetPath)
    );
    this.localeStrings = new LocalizedStrings(localeAssets);
  }

  getString(key: string): string {
    // @ts-ignore
    return this.localeStrings.formatString(this.localeStrings[key]) as string;
  }
}

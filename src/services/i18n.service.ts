import LocalizedStrings, { LocalizedStringsMethods } from 'react-localization';

import { IPCRenderer, IPCCommChannel } from '../modules/ipc';

export class I18nService {
  private static readonly localeAssetPath = 'locales';
  private static readonly localeDefault = 'en';
  private static readonly localeStrings: LocalizedStringsMethods = new LocalizedStrings({
    [this.localeDefault]: this.getLocaleFile(this.localeDefault),
  });

  static getString(key: string, values?: Record<string, string | number | JSX.Element>): string {
    // values can be named object for string substitution
    // @see - https://www.npmjs.com/package/react-localization#api
    // @ts-ignore
    return this.localeStrings.formatString(this.localeStrings[key], values) as string;
  }

  private static getLocaleFile(locale: string): object {
    const localeRaw = IPCRenderer.sendSyncMessage(IPCCommChannel.FSReadAsset, [this.localeAssetPath, `${locale}.json`], {
      encoding: 'utf8',
    });
    return JSON.parse(localeRaw);
  }
}

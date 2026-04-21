import semver from 'semver';

export class VersionUtils {
  static isGreater(installedVersion: string, availableVersion: string) {
    if (!availableVersion) {
      return false;
    }

    const installed = this.normalizeVersion(installedVersion);
    const available = this.normalizeVersion(availableVersion);

    if (!semver.valid(installed) || !semver.valid(available)) {
      throw new Error(
        `Invalid version comparison: installed="${installedVersion}", available="${availableVersion}"`,
      );
    }

    return semver.gt(available, installed);
  }

  static normalizeVersion(version: string) {
    return version.trim().replace(/^v/i, '');
  }
}

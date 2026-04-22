import { GithubReleaseApiItem, GithubReleaseInfo } from './types';

export class GithubService {
  static async getLatestStableRelease(repository: string): Promise<GithubReleaseInfo | null> {
    const response = await fetch(`https://api.github.com/repos/${repository}/releases/latest`, {
      headers: {
        Accept: 'application/vnd.github+json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch latest release for ${repository} (${response.status})`);
    }

    const release = (await response.json()) as GithubReleaseApiItem;
    if (!release) {
      return null;
    }

    return {
      version: release.tag_name,
      releasedDate: release.published_at as string,
    };
  }

  static async getLatestPreRelease(repository: string): Promise<GithubReleaseInfo | null> {
    const response = await fetch(`https://api.github.com/repos/${repository}/releases`, {
      headers: {
        Accept: 'application/vnd.github+json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch releases for ${repository} (${response.status})`);
    }

    const releases = (await response.json()) as GithubReleaseApiItem[];

    const matchingRelease = releases
      .filter(release => !release.draft && release.prerelease && Boolean(release.published_at))
      .sort((a, b) => new Date(b.published_at as string).getTime()
        - new Date(a.published_at as string).getTime())[0];

    if (!matchingRelease) {
      return null;
    }

    return {
      version: matchingRelease.tag_name,
      releasedDate: matchingRelease.published_at as string,
    };
  }
}

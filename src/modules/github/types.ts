export type GithubReleaseApiItem = {
  tag_name: string;
  published_at: string | null;
  prerelease: boolean;
  draft: boolean;
};

export type GithubReleaseInfo = {
  version: string;
  releasedDate: string;
};

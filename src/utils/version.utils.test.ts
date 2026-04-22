import { VersionUtils } from './version.utils';

describe('VersionUtils.isGreater', () => {
  it('returns false when stable versions are equal apart from leading v', () => {
    expect(VersionUtils.isGreater('1.0.0', 'v1.0.0')).toBe(false);
  });

  it('returns true when available stable is newer than installed stable', () => {
    expect(VersionUtils.isGreater('1.0.0', 'v1.0.1')).toBe(true);
  });

  it('returns false when available stable is older than installed stable', () => {
    expect(VersionUtils.isGreater('1.0.1', 'v1.0.0')).toBe(false);
  });

  it('returns true when available prerelease is newer than installed prerelease', () => {
    expect(
      VersionUtils.isGreater(
        '1.0.0-dev.34.git1234567',
        'v1.0.0-dev.35.gitae5b4d1',
      ),
    ).toBe(true);
  });

  it('returns false when prerelease versions are equal apart from leading v', () => {
    expect(
      VersionUtils.isGreater(
        '1.0.0-dev.35.gitae5b4d1',
        'v1.0.0-dev.35.gitae5b4d1',
      ),
    ).toBe(false);
  });

  it('returns false when available prerelease is older than installed prerelease', () => {
    expect(
      VersionUtils.isGreater(
        '1.0.0-dev.35.gitae5b4d1',
        'v1.0.0-dev.34.git1234567',
      ),
    ).toBe(false);
  });

  it('returns true when available stable is newer than installed prerelease', () => {
    expect(
      VersionUtils.isGreater(
        '1.0.0-dev.35.gitae5b4d1',
        'v1.0.0',
      ),
    ).toBe(true);
  });

  it('returns true when available prerelease is newer than installed stable', () => {
    expect(
      VersionUtils.isGreater(
        '1.0.0',
        'v1.0.1-dev.1',
      ),
    ).toBe(true);
  });
});

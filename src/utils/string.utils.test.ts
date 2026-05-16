import { buildLink, buildRoute } from './string.utils';

describe('buildRoute', () => {
  it('builds application routes with path mappings', () => {
    expect(buildRoute('/library/playlists/:playlistId', {
      playlistId: '123',
    })).toBe('/library/playlists/123');
  });
});

describe('buildLink', () => {
  it('builds absolute links with placeholder mappings', () => {
    expect(buildLink('https://github.com/bbbneo333/aurora/releases/tag/v{version}', {
      version: '1.0.0',
    })).toBe('https://github.com/bbbneo333/aurora/releases/tag/v1.0.0');
  });
});

import fs from 'fs';
import https from 'https';
import path from 'path';
import { spawnSync } from 'child_process';
import { IAppMain, IAppModule } from '../../interfaces';
import { IPCCommChannel, IPCMain, IPCRendererCommChannel } from '../ipc';

const debug = require('debug')('aurora:module:device');

export class DeviceModule implements IAppModule {
  private readonly app: IAppMain;
  private readonly volumesPath = '/Volumes';
  private readonly discogsBaseUrl = 'https://api.discogs.com';
  private readonly musicBrainzBaseUrl = 'https://musicbrainz.org/ws/2';
  private readonly cdAbsenceGracePeriodMs = 15000;
  private readonly deviceBusyWaitTimeoutMs = 20000;
  private readonly deviceBusyWaitIntervalMs = 500;
  private readonly stableCdDeepScanIntervalMs = 30000;
  private readonly volumePollingIntervalMs = 60000;
  private currentCdPath: string | null = null;
  private currentCdName: string | null = null;
  private currentCdLastSeenAt = 0;
  private lastVolumeDirectorySignature = '';
  private lastDeepVolumeScanAt = 0;
  private watcher: fs.FSWatcher | null = null;

  constructor(app: IAppMain) {
    this.app = app;
    this.registerMessageHandlers();
    this.init();
  }

  private registerMessageHandlers() {
    IPCMain.addSyncMessageHandler(IPCCommChannel.DeviceGetAudioCdStatus, this.getAudioCdStatus, this);
    IPCMain.addAsyncMessageHandler(IPCCommChannel.DeviceGetAudioCdTracks, this.getAudioCdTracks, this);
    IPCMain.addAsyncMessageHandler(IPCCommChannel.DeviceEjectAudioCd, this.ejectAudioCd, this);
    IPCMain.addAsyncMessageHandler(IPCCommChannel.DeviceSearchDiscogsReleases, this.searchDiscogsReleases, this);
    IPCMain.addAsyncMessageHandler(IPCCommChannel.DeviceGetDiscogsRelease, this.getDiscogsRelease, this);
    IPCMain.addAsyncMessageHandler(IPCCommChannel.DeviceImportAudioCd, this.importAudioCd, this);
  }

  private writeCdMatchingCli(label: string, payload: unknown) {
    try {
      const serializedPayload = JSON.stringify(payload);
      process.stdout.write(`[CD_MATCH] ${label}: ${serializedPayload}\n`);
    } catch (_error) {
      process.stdout.write(`[CD_MATCH] ${label}: {"error":"payload_not_serializable"}\n`);
    }
  }

  private getAudioCdStatus() {
    this.refreshAudioCdStatusSync();

    return {
      present: !!this.currentCdPath,
      path: this.currentCdPath,
      name: this.currentCdName
    };
  }

  private refreshAudioCdStatusSync() {
    const detectedCd = this.detectAudioCdFromVolumesSync();
    this.currentCdPath = detectedCd?.path || null;
    this.currentCdName = detectedCd?.name || null;
    this.currentCdLastSeenAt = detectedCd ? Date.now() : 0;
  }

  private detectAudioCdFromVolumesSync(): { path: string, name: string } | null {
    try {
      if (!fs.existsSync(this.volumesPath)) {
        return null;
      }

      const directories = fs.readdirSync(this.volumesPath, { withFileTypes: true })
        .filter(entry => entry.isDirectory())
        .filter(entry => !entry.name.startsWith('.'));

      const cdDirectory = directories
        .map(directory => ({
          path: path.join(this.volumesPath, directory.name),
          name: directory.name,
        }))
        .find(directory => this.isAudioCdSync(directory.path, directory.name));

      return cdDirectory || null;
    } catch (error) {
      debug('Error during synchronous CD detection: %o', error);
      return null;
    }
  }

  private isAudioCdSync(dirPath: string, dirName?: string): boolean {
    try {
      const files = fs.readdirSync(dirPath);
      return files.some(fileName => (
        fileName.toLowerCase().endsWith('.aiff')
        || fileName.toLowerCase().endsWith('.cdda')
        || fileName.toLowerCase().endsWith('.cda')
      ));
    } catch (error) {
      if (this.isPermissionDeniedError(error)) {
        return this.isLikelyAudioCdVolume(dirPath, dirName) || this.isAudioCdByDiskutil(dirPath);
      }

      return false;
    }
  }

  private async getAudioCdTracks() {
    const cdPath = this.currentCdPath;
    if (!cdPath) {
      return [];
    }

    const isAvailable = await this.waitForVolumeAvailability(cdPath);
    if (!isAvailable) {
      debug('Audio CD still busy after waiting: %s', cdPath);
      return [];
    }

    return this.getAudioFiles(cdPath);
  }

  private async ejectAudioCd() {
    const currentCdPath = this.currentCdPath;
    const commandResults: Array<{ command: string, status: number | null, stderr: string }> = [];
    const runCommand = (command: string, args: string[]) => {
      const result = spawnSync(command, args, { encoding: 'utf-8' });
      commandResults.push({
        command: `${command} ${args.join(' ')}`,
        status: result.status,
        stderr: (result.stderr || '').trim(),
      });
      return result.status === 0;
    };

    const diskIdentifier = currentCdPath
      ? ((spawnSync('diskutil', ['info', currentCdPath], { encoding: 'utf-8' }).stdout || '').match(/Device Identifier:\s*([^\s]+)/i)?.[1])
      : null;

    const isEjected = (currentCdPath ? runCommand('diskutil', ['eject', currentCdPath]) : false)
      || (!!diskIdentifier && runCommand('diskutil', ['eject', diskIdentifier]))
      || runCommand('drutil', ['tray', 'eject']);

    if (!isEjected) {
      await this.checkVolumes();
      if (!this.currentCdPath) {
        return true;
      }

      const errorDetails = commandResults
        .map(result => `${result.command} (status ${result.status ?? 'null'}) ${result.stderr}`)
        .join(' | ')
        .trim();
      throw new Error(errorDetails || 'Failed to eject audio CD');
    }

    await this.checkVolumes();

    if (!this.currentCdPath) {
      this.sendUpdate(false);
      return true;
    }

    this.sendUpdate(true, this.currentCdPath, this.currentCdName || undefined);
    return false;
  }

  private async getAudioFiles(cdPath: string) {
    try {
      const audioFileNames = await this.getAudioTrackFileNames(cdPath);
      const audioFiles = await Promise.all(audioFileNames.map(async (fileName) => {
        const filePath = path.join(cdPath, fileName);
        let duration = 0;
        try {
          const fileStats = await fs.promises.stat(filePath);
          duration = this.parseAudioTrackDurationFromBytes(fileStats.size);
        } catch (error) {
          debug('Could not read track stats (%s): %o', filePath, error);
        }

        return {
          name: path.parse(fileName).name,
          path: filePath,
          duration,
        };
      }));

      return audioFiles;
    } catch (error) {
      debug('Error getting CD tracks:', error);
      return [];
    }
  }

  private async getAudioTrackFileNames(cdPath: string): Promise<string[]> {
    const files = await fs.promises.readdir(cdPath);
    return files
      .filter(f => f.toLowerCase().endsWith('.aiff') || f.toLowerCase().endsWith('.cdda') || f.toLowerCase().endsWith('.cda'))
      .sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)?.[0] || '0', 10);
        const numB = parseInt(b.match(/\d+/)?.[0] || '0', 10);
        return numA - numB;
      });
  }

  private parseDiscogsTrackDurationToSeconds(trackDuration?: string): number {
    if (!trackDuration) {
      return 0;
    }

    const parts = trackDuration.trim().split(':').map(part => Number(part));
    if (parts.some(part => Number.isNaN(part) || part < 0)) {
      return 0;
    }

    if (parts.length === 2) {
      return (parts[0] * 60) + parts[1];
    }

    if (parts.length === 3) {
      return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
    }

    return 0;
  }

  private parseAudioTrackDurationFromBytes(fileSizeBytes: number): number {
    const estimatedDurationSeconds = Math.max(1, Math.round(Math.max(0, fileSizeBytes) / 176400));
    return estimatedDurationSeconds;
  }

  private async searchDiscogsReleases(input: {
    token: string;
    query: string;
    artist?: string;
  }) {
    const token = input?.token?.trim();
    if (!token) {
      throw new Error('Discogs token is required');
    }

    const query = (input.query || '').trim();
    if (!query) {
      throw new Error('Discogs query is required');
    }

    const inputArtist = (input.artist || '').trim();
    const tocLookup = await this.lookupMusicBrainzReleaseHintsFromCurrentCdToc();
    const musicBrainzHints = tocLookup.releases;
    const hintedArtistFromHints = musicBrainzHints
      .map(hint => (hint.artist || '').trim())
      .find(Boolean) || '';
    const hintedArtist = inputArtist || hintedArtistFromHints;
    const searchQueries = Array.from(new Set([
      ...musicBrainzHints.map(hint => hint.title).filter(Boolean),
      query,
    ]))
      .map(searchQuery => String(searchQuery || '').trim())
      .filter(Boolean);
    const effectiveSearchQueries = searchQueries.filter(searchQuery => !this.isGenericDiscogsQuery(searchQuery));
    const searchQueriesForLookup = effectiveSearchQueries.length ? effectiveSearchQueries : searchQueries;

    this.writeCdMatchingCli('search_input', {
      cdPath: this.currentCdPath,
      cdName: this.currentCdName,
      query,
      artist: inputArtist || null,
      toc: tocLookup.toc,
      tocSource: tocLookup.tocSource,
      musicBrainzHints: musicBrainzHints.map(hint => ({
        title: hint.title,
        artist: hint.artist || null,
      })),
      searchQueries,
      effectiveSearchQueries: searchQueriesForLookup,
      hintedArtist: hintedArtist || null,
    });

    const searchResultBatches = await Promise.all(
      searchQueriesForLookup.map(searchQuery => this.searchDiscogsReleaseBatch(token, searchQuery, hintedArtist || undefined)),
    );
    const mergedResults = searchResultBatches.reduce(
      (allResults, batch) => this.mergeDiscogsResults(allResults, batch),
      [] as any[],
    );
    const normalizedResults = mergedResults.slice(0, 24).map((item: any) => {
      const rawTitle = String(item.title || '');
      const parts = rawTitle.split(' - ');

      return {
        id: item.id,
        title: parts.slice(1).join(' - ') || rawTitle,
        artist: parts.length > 1 ? parts[0] : undefined,
        year: item.year || undefined,
        genre: Array.isArray(item.genre) ? item.genre.join(', ') : '',
        cover_image: item.cover_image || item.thumb || '',
      };
    });
    const scoredResults = normalizedResults
      .map((release: any) => ({
        ...release,
        probability: this.calculateDiscogsCandidateProbability(release, searchQueriesForLookup, hintedArtist || undefined),
      }))
      .sort((releaseA: any, releaseB: any) => (releaseB.probability || 0) - (releaseA.probability || 0));

    this.writeCdMatchingCli('discogs_candidates', scoredResults.map((release: any) => ({
      id: release.id,
      artist: release.artist || null,
      title: release.title,
      year: release.year || null,
      probability: release.probability || 0,
    })));

    return scoredResults;
  }

  private async searchDiscogsReleaseBatch(token: string, query: string, artist?: string) {
    const params = new URLSearchParams({
      type: 'release',
      per_page: '12',
      release_title: query,
    });

    if (artist && artist.trim()) {
      params.set('artist', artist.trim());
    }

    const response = await this.requestDiscogsJson(`/database/search?${params.toString()}`, token);
    return Array.isArray(response?.results) ? response.results : [];
  }

  private mergeDiscogsResults(existingResults: any[], newResults: any[]) {
    const merged = [...existingResults];
    const existingIds = new Set(existingResults.map(item => item?.id).filter(Boolean));
    newResults.forEach((item) => {
      if (!existingIds.has(item?.id)) {
        merged.push(item);
        existingIds.add(item?.id);
      }
    });
    return merged;
  }

  private calculateDiscogsCandidateProbability(
    release: { title?: string; artist?: string },
    searchQueries: string[],
    hintedArtist?: string,
  ): number {
    const normalizedReleaseTitle = String(release.title || '').trim().toLowerCase();
    const releaseTitleTokens = this.tokenizeDiscogsMatchingText(release.title || '');
    const releaseArtistTokens = this.tokenizeDiscogsMatchingText(release.artist || '');
    if (!releaseTitleTokens.length && !releaseArtistTokens.length) {
      return 0;
    }

    const queryTokenMatches = searchQueries.map((searchQuery) => {
      const queryTokens = this.tokenizeDiscogsMatchingText(searchQuery);
      if (!queryTokens.length) {
        return 0;
      }

      const normalizedQuery = searchQuery.trim().toLowerCase();
      const titleMatchCount = queryTokens.filter(token => releaseTitleTokens.includes(token)).length;
      const tokenCoverage = titleMatchCount / queryTokens.length;
      const tokenSpecificity = Math.min(1, queryTokens.length / 4);
      const exactMatchBoost = normalizedQuery === normalizedReleaseTitle ? 0.2 : 0;
      const partialMatchBoost = normalizedReleaseTitle.includes(normalizedQuery) ? 0.1 : 0;
      return (tokenCoverage * (0.7 + (tokenSpecificity * 0.3))) + exactMatchBoost + partialMatchBoost;
    });
    const bestQueryMatch = Math.min(1, Math.max(0, ...queryTokenMatches));
    const titleSimilarity = Math.round(bestQueryMatch * 58);

    let artistSimilarity = 0;
    if (hintedArtist) {
      const hintedArtistTokens = this.tokenizeDiscogsMatchingText(hintedArtist);
      if (hintedArtistTokens.length) {
        const artistTokenMatchCount = hintedArtistTokens
          .filter(token => releaseArtistTokens.includes(token)).length;
        const artistTokenCoverage = artistTokenMatchCount / hintedArtistTokens.length;
        artistSimilarity = Math.round(artistTokenCoverage * 42);
      }
    }

    return Math.max(0, Math.min(100, titleSimilarity + artistSimilarity));
  }

  private isGenericDiscogsQuery(query: string): boolean {
    const normalizedQuery = String(query || '')
      .toLowerCase()
      .replace(/[^a-z0-9äöüß]+/g, ' ')
      .trim();
    if (!normalizedQuery) {
      return true;
    }

    const genericQueries = new Set([
      'audio cd',
      'cd audio',
      'audio',
      'cd',
      'unknown album',
      'unknown artist',
      'various artists',
    ]);
    if (genericQueries.has(normalizedQuery)) {
      return true;
    }

    const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
    return tokens.length <= 1 && genericQueries.has(tokens[0]);
  }

  private tokenizeDiscogsMatchingText(value: string): string[] {
    return String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9äöüß]+/g, ' ')
      .split(' ')
      .map(token => token.trim())
      .filter(Boolean);
  }

  private async lookupMusicBrainzReleaseHintsFromCurrentCdToc(): Promise<{
    toc: string | null;
    tocSource: string;
    releases: Array<{ title: string; artist?: string }>;
  }> {
    const { toc, source: tocSource } = await this.getCurrentAudioCdTocLookup();
    if (!toc) {
      return {
        toc: null,
        tocSource,
        releases: [],
      };
    }

    const endpoint = `/discid/-?toc=${encodeURIComponent(toc)}&fmt=json&cdstubs=no&inc=artists+artist-credits`;
    try {
      const response = await this.requestMusicBrainzJson(endpoint);
      const releases = Array.isArray(response?.releases) ? response.releases : [];
      return {
        toc,
        tocSource,
        releases: releases
          .slice(0, 5)
          .map((release: any) => ({
            title: String(release?.title || '').trim(),
            artist: this.extractMusicBrainzArtistName(release),
          }))
          .filter((release: { title: string }) => !!release.title),
      };
    } catch (error) {
      debug('MusicBrainz TOC lookup failed: %o', error);
      return {
        toc,
        tocSource,
        releases: [],
      };
    }
  }

  private extractMusicBrainzArtistName(release: any): string | undefined {
    if (typeof release?.['artist-credit-phrase'] === 'string') {
      const artistCreditPhrase = release['artist-credit-phrase'].trim();
      if (artistCreditPhrase) {
        return artistCreditPhrase;
      }
    }

    const artistCredits = Array.isArray(release?.['artist-credit'])
      ? release['artist-credit']
      : [];
    const artistNames = artistCredits
      .map((credit: any) => {
        if (typeof credit === 'string') {
          return credit;
        }
        if (typeof credit?.name === 'string') {
          return credit.name;
        }
        if (typeof credit?.artist?.name === 'string') {
          return credit.artist.name;
        }
        return '';
      })
      .map((name: string) => name.trim())
      .filter(Boolean);

    const joined = artistNames.join(' ').trim();
    return joined || undefined;
  }

  private async getCurrentAudioCdTocLookup(): Promise<{ toc: string | null; source: string }> {
    const drutilTocResult = spawnSync('drutil', ['toc'], { encoding: 'utf-8' });
    if (drutilTocResult.status !== 0) {
      return this.getAudioFilesBasedTocLookup();
    }

    const drutilTocLookup = this.parseDrutilTocLookupString(drutilTocResult.stdout || '');
    if (drutilTocLookup) {
      return { toc: drutilTocLookup, source: 'drutil' };
    }

    return this.getAudioFilesBasedTocLookup();
  }

  private async getAudioFilesBasedTocLookup(): Promise<{ toc: string | null; source: string }> {
    if (!this.currentCdPath) {
      return { toc: null, source: 'none' };
    }

    const isAvailable = await this.waitForVolumeAvailability(this.currentCdPath, 8000);
    if (!isAvailable) {
      return { toc: null, source: 'none' };
    }

    const audioFiles = await this.getAudioFiles(this.currentCdPath);
    const fallbackToc = await this.buildApproximateTocFromAudioFiles(audioFiles);
    if (!fallbackToc) {
      return { toc: null, source: 'none' };
    }

    return { toc: fallbackToc, source: 'audio-files' };
  }

  private async buildApproximateTocFromAudioFiles(audioFiles: Array<{ path: string }>): Promise<string | null> {
    if (!audioFiles.length) {
      return null;
    }

    const sectorDurations = await Promise.all(audioFiles.map(async (audioFile) => {
      try {
        const fileStats = await fs.promises.stat(audioFile.path);
        const estimatedDurationSeconds = Math.max(1, Math.round(fileStats.size / 176400));
        const sectors = Math.round(estimatedDurationSeconds * 75);
        return sectors > 0 ? sectors : 1;
      } catch (error) {
        debug('Could not read track stats for TOC fallback (%s): %o', audioFile.path, error);
        return 75;
      }
    }));
    const offsets = sectorDurations.reduce((allOffsets, _currentDuration, index) => {
      if (index === 0) {
        return [150];
      }

      return [...allOffsets, allOffsets[allOffsets.length - 1] + sectorDurations[index - 1]];
    }, [] as number[]);
    const leadOut = offsets[offsets.length - 1] + sectorDurations[sectorDurations.length - 1];

    return [1, audioFiles.length, leadOut, ...offsets].join(' ');
  }

  private parseDrutilTocLookupString(drutilOutput: string): string | null {
    const leadOutMatch = drutilOutput.match(/lead-?out[^0-9]*(\d+)/i);
    const leadOut = Number(leadOutMatch?.[1] || 0);
    if (!leadOut) {
      return null;
    }

    const trackStartByNumber = new Map<number, number>();
    drutilOutput.split('\n').forEach((line) => {
      const lineMatch = line.match(/^\s*(\d+)\s+(.+)$/);
      if (!lineMatch) {
        return;
      }

      const trackNumber = Number(lineMatch[1]);
      const numberTokens = lineMatch[2]
        .split(/\s+/)
        .map(token => Number(token))
        .filter(token => !Number.isNaN(token) && token >= 0);
      const trackStart = numberTokens.find(token => token >= 100) ?? numberTokens[0];
      if (Number.isNaN(trackNumber) || Number.isNaN(trackStart) || trackNumber <= 0 || trackStart <= 0) {
        return;
      }

      trackStartByNumber.set(trackNumber, trackStart);
    });

    const sortedTrackNumbers = Array.from(trackStartByNumber.keys()).sort((a, b) => a - b);
    if (!sortedTrackNumbers.length) {
      return null;
    }

    const firstTrack = sortedTrackNumbers[0];
    const lastTrack = sortedTrackNumbers[sortedTrackNumbers.length - 1];
    const offsets = sortedTrackNumbers
      .map(trackNumber => trackStartByNumber.get(trackNumber))
      .filter((offset): offset is number => Number.isInteger(offset) && !!offset);

    if (offsets.length !== sortedTrackNumbers.length) {
      return null;
    }

    return [firstTrack, lastTrack, leadOut, ...offsets].join(' ');
  }

  private async getDiscogsRelease(input: { token: string; releaseId: number }) {
    const token = input?.token?.trim();
    if (!token) {
      throw new Error('Discogs token is required');
    }
    if (!input?.releaseId) {
      throw new Error('Discogs releaseId is required');
    }

    const release = await this.requestDiscogsJson(`/releases/${input.releaseId}`, token);
    const tracklist = Array.isArray(release.tracklist) ? release.tracklist : [];
    const artist = release.artists_sort
      || (Array.isArray(release.artists) ? release.artists.map((a: any) => a.name).join(', ') : '');
    const releaseImages = Array.isArray(release.images) ? release.images : [];
    const primaryImage = releaseImages.find((image: any) => image?.type === 'primary') || releaseImages[0];
    const highResCoverImage = String(
      primaryImage?.uri
      || primaryImage?.resource_url
      || release.cover_image
      || release.thumb
      || '',
    );

    return {
      id: release.id,
      title: release.title || this.currentCdName || 'Audio CD',
      artist: artist || 'Unknown Artist',
      year: release.year || undefined,
      genre: [
        ...(Array.isArray(release.genres) ? release.genres : []),
        ...(Array.isArray(release.styles) ? release.styles : []),
      ].filter(Boolean).join(', '),
      cover_image: highResCoverImage,
      tracks: tracklist
        .filter((t: any) => t.type_ === 'track')
        .map((t: any, index: number) => ({
          number: index + 1,
          title: t.title || `Track ${index + 1}`,
          position: t.position || '',
          duration: this.parseDiscogsTrackDurationToSeconds(t.duration),
        })),
    };
  }

  private async importAudioCd(input: {
    outputDirectory: string;
    namingTemplate: string;
    metadata: {
      artist?: string;
      title?: string;
      year?: number;
      genre?: string;
      tracks?: Array<{ title?: string }>;
    };
  }) {
    const cdPath = this.currentCdPath;
    if (!cdPath) {
      throw new Error('No Audio CD detected');
    }

    const outputDirectory = (input.outputDirectory || '').trim();
    if (!outputDirectory) {
      throw new Error('Import output directory is missing');
    }

    const albumArtist = (input.metadata?.artist || 'Unknown Artist').trim();
    const albumTitle = (input.metadata?.title || this.currentCdName || 'Audio CD').trim();
    const albumYear = input.metadata?.year ? String(input.metadata.year) : '';
    const albumGenre = (input.metadata?.genre || '').trim();
    const namingTemplate = (input.namingTemplate || '<Künstler> - <Album-Title> (<Erscheinungsjahr>)').trim();

    const albumDirectoryName = this.sanitizePathSegment(
      this.resolveNamingTemplate(namingTemplate, {
        artist: albumArtist,
        album: albumTitle,
        year: albumYear,
      }) || `${albumArtist} - ${albumTitle}`,
    );

    const targetDirectory = path.join(outputDirectory, albumDirectoryName);
    await fs.promises.mkdir(targetDirectory, { recursive: true });

    const isAvailable = await this.waitForVolumeAvailability(cdPath);
    if (!isAvailable) {
      throw new Error('Audio CD is currently busy in another application');
    }

    const audioFiles = await this.getAudioFiles(cdPath);
    if (!audioFiles.length) {
      throw new Error('No CD tracks found for import');
    }

    const convertedFiles: string[] = [];
    const metadataAvailable = this.commandExists('ffmpeg') || this.commandExists('metaflac');
    if (!metadataAvailable) {
      throw new Error('For FLAC metadata support please install ffmpeg or metaflac');
    }

    for (let index = 0; index < audioFiles.length; index += 1) {
      const sourceTrack = audioFiles[index];
      const trackTitle = (input.metadata?.tracks?.[index]?.title || sourceTrack.name || `Track ${index + 1}`).trim();
      const outputName = `${String(index + 1).padStart(2, '0')} - ${this.sanitizePathSegment(trackTitle)}.flac`;
      const outputPath = path.join(targetDirectory, outputName);

      this.convertToFlac(sourceTrack.path, outputPath, {
        artist: albumArtist,
        albumArtist,
        album: albumTitle,
        title: trackTitle,
        year: albumYear,
        genre: albumGenre,
        track: `${index + 1}/${audioFiles.length}`,
      });

      convertedFiles.push(outputPath);
    }

    return {
      importedDirectory: targetDirectory,
      files: convertedFiles,
      count: convertedFiles.length,
    };
  }

  private resolveNamingTemplate(template: string, values: {
    artist: string;
    album: string;
    year: string;
  }) {
    const replacements: Record<string, string> = {
      'künstler': values.artist,
      'artist': values.artist,
      'album-artist': values.artist,
      'album artist': values.artist,
      'album-title': values.album,
      'album title': values.album,
      'album': values.album,
      'erscheinungsjahr': values.year,
      'year': values.year,
    };

    return template.replace(/<([^>]+)>/g, (_matched, key) => {
      const lookupKey = String(key || '').trim().toLowerCase();
      return replacements[lookupKey] || '';
    }).trim();
  }

  private sanitizePathSegment(value: string): string {
    return value
      .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private commandExists(command: string): boolean {
    const result = spawnSync('which', [command], { encoding: 'utf-8' });
    return result.status === 0;
  }

  private convertToFlac(source: string, target: string, tags: {
    artist: string;
    albumArtist: string;
    album: string;
    title: string;
    year?: string;
    genre?: string;
    track: string;
  }) {
    if (this.commandExists('ffmpeg')) {
      const ffmpegArgs = [
        '-y',
        '-i',
        source,
        '-c:a',
        'flac',
        '-metadata',
        `artist=${tags.artist}`,
        '-metadata',
        `album_artist=${tags.albumArtist}`,
        '-metadata',
        `album=${tags.album}`,
        '-metadata',
        `title=${tags.title}`,
        '-metadata',
        `track=${tags.track}`,
      ];

      if (tags.year) {
        ffmpegArgs.push('-metadata', `date=${tags.year}`);
      }
      if (tags.genre) {
        ffmpegArgs.push('-metadata', `genre=${tags.genre}`);
      }
      ffmpegArgs.push(target);

      const ffmpegResult = spawnSync('ffmpeg', ffmpegArgs, { encoding: 'utf-8' });
      if (ffmpegResult.status !== 0) {
        throw new Error(ffmpegResult.stderr || 'ffmpeg failed to convert track');
      }
      return;
    }

    if (!this.commandExists('afconvert')) {
      throw new Error('afconvert is not available on this system');
    }

    const convertResult = spawnSync('afconvert', ['-f', 'flac', '-d', 'LEI16', source, '-o', target], {
      encoding: 'utf-8',
    });
    if (convertResult.status !== 0) {
      throw new Error(convertResult.stderr || 'afconvert failed to convert track');
    }

    if (!this.commandExists('metaflac')) {
      throw new Error('metaflac is required to write FLAC metadata');
    }

    const metaflacArgs = [
      '--remove-all-tags',
      `--set-tag=ARTIST=${tags.artist}`,
      `--set-tag=ALBUMARTIST=${tags.albumArtist}`,
      `--set-tag=ALBUM=${tags.album}`,
      `--set-tag=TITLE=${tags.title}`,
      `--set-tag=TRACKNUMBER=${tags.track.split('/')[0]}`,
    ];
    if (tags.year) {
      metaflacArgs.push(`--set-tag=DATE=${tags.year}`);
    }
    if (tags.genre) {
      metaflacArgs.push(`--set-tag=GENRE=${tags.genre}`);
    }
    metaflacArgs.push(target);

    const tagResult = spawnSync('metaflac', metaflacArgs, { encoding: 'utf-8' });
    if (tagResult.status !== 0) {
      throw new Error(tagResult.stderr || 'metaflac failed to write FLAC metadata');
    }
  }

  private requestDiscogsJson(endpoint: string, token: string): Promise<any> {
    const requestUrl = `${this.discogsBaseUrl}${endpoint}`;
    return this.requestJson(requestUrl, {
      Authorization: `Discogs token=${token}`,
      'User-Agent': 'Aurora/1.0 (+https://github.com/bbbneo333/aurora)',
    });
  }

  private requestMusicBrainzJson(endpoint: string): Promise<any> {
    const requestUrl = `${this.musicBrainzBaseUrl}${endpoint}`;
    return this.requestJson(requestUrl, {
      'User-Agent': 'Aurora/1.0 (+https://github.com/bbbneo333/aurora)',
    });
  }

  private requestJson(requestUrl: string, headers?: Record<string, string>): Promise<any> {
    return new Promise((resolve, reject) => {
      const request = https.get(requestUrl, {
        headers,
      }, (response) => {
        const statusCode = response.statusCode || 500;
        let body = '';
        response.setEncoding('utf8');
        response.on('data', (chunk) => {
          body += chunk;
        });
        response.on('end', () => {
          if (statusCode < 200 || statusCode >= 300) {
            reject(new Error(`Request failed (${statusCode}): ${body}`));
            return;
          }

          try {
            resolve(JSON.parse(body));
          } catch (error: any) {
            reject(new Error(`Invalid JSON response: ${error.message}`));
          }
        });
      });

      request.on('error', reject);
    });
  }

  private init() {
    if (process.platform !== 'darwin') {
      debug('Device monitoring only supported on macOS for now');
      return;
    }

    // Initial check
    this.checkVolumes();
    
    // Start watching
    this.startWatching();

    // Start polling as a fallback
    setInterval(() => {
      this.checkVolumes();
    }, this.volumePollingIntervalMs);

    process.once('exit', () => {
      if (this.watcher) {
        this.watcher.close();
      }
    });
  }

  private startWatching() {
    try {
      if (fs.existsSync(this.volumesPath)) {
        this.watcher = fs.watch(this.volumesPath, (eventType, filename) => {
          debug('Volume change detected:', eventType, filename);
          // Debounce could be added here if needed, but for now direct check is fine
          this.checkVolumes();
        });
      }
    } catch (error) {
      debug('Error watching volumes:', error);
    }
  }

  private async checkVolumes() {
    try {
      if (!fs.existsSync(this.volumesPath)) {
        debug('Volumes path does not exist: %s', this.volumesPath);
        return;
      }

      const entries = await fs.promises.readdir(this.volumesPath, { withFileTypes: true });
      const directories = entries.filter(e => e.isDirectory());
      const visibleDirectories = directories.filter(directory => !directory.name.startsWith('.'));
      const volumeDirectorySignature = visibleDirectories
        .map(directory => directory.name)
        .sort()
        .join('|');
      const now = Date.now();
      const currentCdVolumeName = this.currentCdPath ? path.basename(this.currentCdPath) : '';
      const currentCdStillMounted = !!currentCdVolumeName
        && visibleDirectories.some(directory => directory.name === currentCdVolumeName);
      const shouldSkipDeepScan = !!this.currentCdPath
        && currentCdStillMounted
        && this.lastVolumeDirectorySignature === volumeDirectorySignature
        && (now - this.lastDeepVolumeScanAt) < this.stableCdDeepScanIntervalMs;
      if (shouldSkipDeepScan) {
        this.currentCdLastSeenAt = now;
        return;
      }

      this.lastVolumeDirectorySignature = volumeDirectorySignature;
      this.lastDeepVolumeScanAt = now;

      let foundCd = false;
      let cdPath = '';
      let cdName = '';

      for (const dir of visibleDirectories) {
        const fullPath = path.join(this.volumesPath, dir.name);
        const isAudioCd = await this.isAudioCd(fullPath, dir.name);
        
        if (isAudioCd) {
          debug('Audio CD found at: %s', fullPath);
          foundCd = true;
          cdPath = fullPath;
          cdName = dir.name;
          break;
        }
      }

      if (foundCd) {
        if (this.currentCdPath !== cdPath || this.currentCdName !== cdName) {
          this.currentCdPath = cdPath;
          this.currentCdName = cdName;
          if (this.canReadVolumeDirectory(cdPath)) {
            this.logAudioCdToc(cdPath, cdName);
          }
          this.sendUpdate(true, cdPath, cdName);
        }
        this.currentCdLastSeenAt = Date.now();
      } else {
        if (this.currentCdPath !== null) {
          const cdWasSeenRecently = (Date.now() - this.currentCdLastSeenAt) < this.cdAbsenceGracePeriodMs;
          if (!cdWasSeenRecently) {
            this.currentCdPath = null;
            this.currentCdName = null;
            this.sendUpdate(false);
          }
        }
      }
    } catch (error) {
      debug('Error checking volumes:', error);
    }
  }

  private async isAudioCd(dirPath: string, dirName?: string): Promise<boolean> {
    try {
      const files = await fs.promises.readdir(dirPath);
      return files.some(f => f.toLowerCase().endsWith('.aiff') || f.toLowerCase().endsWith('.cdda') || f.toLowerCase().endsWith('.cda'));
    } catch (error) {
      if (this.isPermissionDeniedError(error)) {
        return this.isLikelyAudioCdVolume(dirPath, dirName) || this.isAudioCdByDiskutil(dirPath);
      }

      return false;
    }
  }

  private isPermissionDeniedError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }

    const code = (error as { code?: string }).code;
    return code === 'EACCES' || code === 'EPERM';
  }

  private isLikelyAudioCdVolume(dirPath: string, dirName?: string): boolean {
    const normalizedName = (dirName || path.basename(dirPath) || '').toLowerCase();
    return normalizedName === 'audio cd'
      || normalizedName.startsWith('audio cd ')
      || normalizedName.includes('cdda');
  }

  private isAudioCdByDiskutil(dirPath: string): boolean {
    const diskutilInfoResult = spawnSync('diskutil', ['info', dirPath], { encoding: 'utf-8' });
    if (diskutilInfoResult.status !== 0) {
      return false;
    }

    const diskutilOutput = (diskutilInfoResult.stdout || '').toLowerCase();
    return diskutilOutput.includes('audio cd')
      || diskutilOutput.includes('compact disc')
      || diskutilOutput.includes('cdda');
  }

  private logAudioCdToc(cdPath: string, cdName: string) {
    try {
      if (!this.canReadVolumeDirectory(cdPath)) {
        debug('Skipping audio CD TOC logging, volume not readable: %s', cdPath);
        return;
      }

      const drutilTocResult = spawnSync('drutil', ['toc'], { encoding: 'utf-8' });
      const diskutilInfoResult = spawnSync('diskutil', ['info', cdPath], { encoding: 'utf-8' });
      const audioFiles = fs.readdirSync(cdPath)
        .filter(fileName => fileName.toLowerCase().endsWith('.aiff') || fileName.toLowerCase().endsWith('.cdda') || fileName.toLowerCase().endsWith('.cda'))
        .sort((a, b) => {
          const numA = parseInt(a.match(/\d+/)?.[0] || '0', 10);
          const numB = parseInt(b.match(/\d+/)?.[0] || '0', 10);
          return numA - numB;
        })
        .map((fileName) => {
          const filePath = path.join(cdPath, fileName);
          const fileSize = fs.statSync(filePath).size;
          return {
            fileName,
            size: fileSize,
          };
        });

      const tocData = {
        cdName,
        cdPath,
        drutilToc: (drutilTocResult.stdout || '').trim(),
        drutilTocError: (drutilTocResult.stderr || '').trim(),
        diskutilInfo: (diskutilInfoResult.stdout || '').trim(),
        diskutilInfoError: (diskutilInfoResult.stderr || '').trim(),
        tracks: audioFiles,
      };

      debug('Audio CD TOC data: %o', tocData);
    } catch (error) {
      debug('Could not collect audio CD TOC data: %o', error);
    }
  }

  private canReadVolumeDirectory(volumePath: string): boolean {
    try {
      fs.readdirSync(volumePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  private async waitForVolumeAvailability(volumePath: string, timeoutMs = this.deviceBusyWaitTimeoutMs): Promise<boolean> {
    const startedAt = Date.now();
    const waitForAvailability = async (): Promise<boolean> => {
      if (!this.currentCdPath || this.currentCdPath !== volumePath) {
        return false;
      }

      if (this.canReadVolumeDirectory(volumePath)) {
        return true;
      }

      if ((Date.now() - startedAt) >= timeoutMs) {
        return this.canReadVolumeDirectory(volumePath);
      }

      await this.wait(this.deviceBusyWaitIntervalMs);
      return waitForAvailability();
    };

    return waitForAvailability();
  }

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private sendUpdate(present: boolean, path?: string, name?: string) {
    debug('Sending CD update:', { present, path, name });
    this.app.sendMessageToRenderer(IPCRendererCommChannel.DeviceAudioCdUpdate, { present, path, name });
  }
}

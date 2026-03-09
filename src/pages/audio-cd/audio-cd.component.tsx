import classNames from 'classnames/bind';
import React, {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import ReactDOM from 'react-dom';
import { Form, Modal } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { RootState } from '../../reducers';
import { IPCRenderer, IPCCommChannel } from '../../modules/ipc';
import {
  MediaArtistLink,
  MediaCoverPicture,
  Text,
  MediaTrackList,
  Button,
  Icon,
} from '../../components';
import { IMediaTrack, IMediaAlbum, IMediaArtist } from '../../interfaces';
import MediaLocalConstants from '../../providers/media-local/media-local.constants.json';
import { CryptoService } from '../../modules/crypto/service';
import { I18nService, MediaProviderService } from '../../services';
import { Icons } from '../../constants';
import { MediaEnums } from '../../enums';
import styles from './audio-cd.component.css';

const cx = classNames.bind(styles);

type DiscogsRelease = {
  id: number;
  title: string;
  artist?: string;
  year?: number;
  genre?: string;
  cover_image?: string;
  probability?: number;
  tracks?: Array<{ title?: string; duration?: number }>;
};

type RankedDiscogsRelease = {
  release: DiscogsRelease;
  score: number;
};

type DiscogsCdMetadataCacheEntry = {
  release: DiscogsRelease;
  titleQuery: string;
  artistQuery: string;
  updatedAt: number;
};

type DiscogsCdMetadataCache = Record<string, DiscogsCdMetadataCacheEntry>;

const DISCOS_CD_METADATA_CACHE_KEY = 'aurora:audio-cd:discogs-cache';
const DISCOS_CD_METADATA_CACHE_MAX_ENTRIES = 80;

export function AudioCdHeader() {
  return (
    <div className={cx('audio-cd-topbar')}>
      <div className={cx('audio-cd-topbar-title')}>
        {I18nService.getString('label_audio_cd_title')}
      </div>
      <div id="audio-cd-header-controls" className={cx('audio-cd-topbar-controls')}/>
    </div>
  );
}

export function AudioCdPage() {
  const audioCd = useSelector((state: RootState) => state.mediaLibrary.audioCd);
  const [tracks, setTracks] = useState<IMediaTrack[]>([]);
  const [importDirectory, setImportDirectory] = useState('');
  const [namingTemplate, setNamingTemplate] = useState('<Artist> - <Album-Title> (<Year>)');
  const [discogsToken, setDiscogsToken] = useState('');
  const [discogsReleases, setDiscogsReleases] = useState<DiscogsRelease[]>([]);
  const [discogsReleaseProbabilityById, setDiscogsReleaseProbabilityById] = useState<Record<number, number>>({});
  const [selectedDiscogsRelease, setSelectedDiscogsRelease] = useState<DiscogsRelease | null>(null);
  const [selectedDiscogsReleaseId, setSelectedDiscogsReleaseId] = useState<number | ''>('');
  const [showDiscogsSelectionDialog, setShowDiscogsSelectionDialog] = useState(false);
  const [isSearchingDiscogs, setIsSearchingDiscogs] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [discogsSearchTitle, setDiscogsSearchTitle] = useState('');
  const [discogsSearchArtist, setDiscogsSearchArtist] = useState('');
  const [hasDiscogsMetadata, setHasDiscogsMetadata] = useState(false);
  const autoDiscogsLookupKeyRef = useRef<string>('');
  const dismissedAutoDialogCdKeyRef = useRef<string>('');
  const hydratedDiscogsCacheKeyRef = useRef<string>('');
  const discogsArtistName = selectedDiscogsRelease?.artist || I18nService.getString('label_audio_cd_unknown_artist');
  const inferredArtistQuery = (audioCd?.name || '').includes(' - ')
    ? (audioCd?.name || '').split(' - ')[0].trim()
    : '';
  const normalizedCdName = (audioCd?.name || '').trim().toLowerCase();
  const isGenericCdName = useMemo(() => {
    if (!normalizedCdName) {
      return true;
    }
    const genericNames = new Set([
      'audio cd',
      'audio-cd',
      'unknown album',
      'unknown artist',
      'disc',
      'cd',
    ]);
    if (genericNames.has(normalizedCdName)) {
      return true;
    }
    return /^audio\s*cd\b/.test(normalizedCdName);
  }, [normalizedCdName]);
  const inferredArtist = inferredArtistQuery.toLowerCase();
  const currentCdKey = `${audioCd?.path || ''}::${audioCd?.name || ''}`;
  const localTrackDurations = useMemo(
    () => tracks
      .map(track => Math.round(track.track_duration || 0))
      .filter(duration => duration > 0),
    [tracks],
  );
  const localTotalTrackDuration = useMemo(
    () => localTrackDurations.reduce((sum, duration) => sum + duration, 0),
    [localTrackDurations],
  );
  const hasTracks = tracks.length > 0;
  const currentCdMetadataCacheKey = useMemo(() => {
    if (!audioCd?.present || !tracks.length) {
      return '';
    }

    const durationSignature = tracks
      .map(track => Math.max(0, Math.round(track.track_duration || 0)))
      .join(',');
    return CryptoService.sha256(`${(audioCd?.name || '').trim().toLowerCase()}|${tracks.length}|${durationSignature}`);
  }, [audioCd?.name, audioCd?.present, tracks]);
  const hasDiscogsCover = !!selectedDiscogsRelease?.cover_image;
  const coverPicture = useMemo(() => (
    hasDiscogsCover ? {
      image_data: selectedDiscogsRelease?.cover_image as string,
      image_data_type: MediaEnums.MediaTrackCoverPictureImageDataType.Path,
    } : undefined
  ), [hasDiscogsCover, selectedDiscogsRelease?.cover_image]);

  const isClearlyIdentifiedRelease = useCallback((rankedReleases: RankedDiscogsRelease[]) => {
    if (!rankedReleases.length) {
      return false;
    }

    if (rankedReleases.length === 1) {
      return true;
    }

    const bestScore = rankedReleases[0].score;
    const secondBestScore = rankedReleases[1].score;

    return bestScore >= 70 && (bestScore - secondBestScore) >= 18;
  }, []);

  const calculateReleaseProbabilityById = useCallback((rankedReleases: RankedDiscogsRelease[]) => {
    if (!rankedReleases.length) {
      return {};
    }

    if (rankedReleases.length === 1) {
      return {
        [rankedReleases[0].release.id]: 100,
      };
    }

    const bestScore = rankedReleases[0].score;
    const secondBestScore = rankedReleases[1]?.score ?? bestScore;
    const scoreGap = Math.max(0, bestScore - secondBestScore);
    const hasDurationEvidence = rankedReleases.some(entry => (
      (entry.release.tracks || []).some(track => (track.duration || 0) > 0)
    ));
    const isLowConfidenceInput = isGenericCdName && !inferredArtist && !hasDurationEvidence;
    const weightedScores = rankedReleases.map(entry => ({
      releaseId: entry.release.id,
      weight: Math.exp((entry.score - bestScore) / 24),
    }));
    const totalWeight = weightedScores.reduce((sum, entry) => sum + entry.weight, 0);
    if (!totalWeight) {
      return {};
    }

    const rawDistribution = weightedScores.reduce((result, entry) => ({
      ...result,
      [entry.releaseId]: Math.max(1, Math.round((entry.weight / totalWeight) * 100)),
    }), {} as Record<number, number>);
    if (scoreGap >= 40) {
      return rawDistribution;
    }

    let cappedTopProbability = scoreGap >= 25 ? 88 : 78;
    if (isLowConfidenceInput) {
      cappedTopProbability = scoreGap >= 25 ? 58 : 45;
    }
    const topReleaseId = rankedReleases[0].release.id;
    const remainingReleaseIds = rankedReleases
      .slice(1)
      .map(entry => entry.release.id);
    const remainingSum = remainingReleaseIds.reduce(
      (sum, releaseId) => sum + (rawDistribution[releaseId] || 0),
      0,
    );
    if (!remainingReleaseIds.length || remainingSum <= 0) {
      return {
        [topReleaseId]: cappedTopProbability,
      };
    }

    return remainingReleaseIds.reduce((result, releaseId) => ({
      ...result,
      [releaseId]: Math.max(1, Math.round(((rawDistribution[releaseId] || 0) / remainingSum) * (100 - cappedTopProbability))),
    }), {
      [topReleaseId]: cappedTopProbability,
    } as Record<number, number>);
  }, [inferredArtist, isGenericCdName]);

  const scoreDiscogsRelease = useCallback((release: DiscogsRelease, expectedTrackCount: number) => {
    let score = 0;
    const releaseBaseProbability = Math.max(0, Math.min(100, release.probability || 0));
    const normalizedReleaseTitle = (release.title || '').trim().toLowerCase();
    const normalizedReleaseArtist = (release.artist || '').trim().toLowerCase();
    const releaseTrackCount = release.tracks?.length || 0;
    const releaseTrackDurations = (release.tracks || [])
      .map(track => Math.round(track.duration || 0))
      .filter(duration => duration > 0);

    if (!isGenericCdName) {
      if (normalizedCdName && normalizedReleaseTitle === normalizedCdName) {
        score += 44;
      } else if (normalizedCdName && normalizedReleaseTitle.includes(normalizedCdName)) {
        score += 34;
      } else if (normalizedCdName && normalizedCdName.includes(normalizedReleaseTitle)) {
        score += 24;
      } else if (normalizedCdName) {
        const cdNameTokens = normalizedCdName.split(/\s+/).filter(Boolean);
        const releaseTitleTokens = normalizedReleaseTitle.split(/\s+/).filter(Boolean);
        if (cdNameTokens.length && releaseTitleTokens.length) {
          const matchedTitleTokens = cdNameTokens.filter(token => releaseTitleTokens.includes(token)).length;
          score += Math.round((matchedTitleTokens / cdNameTokens.length) * 28);
        }
      }
    }

    if (inferredArtist && normalizedReleaseArtist === inferredArtist) {
      score += 28;
    } else if (inferredArtist && normalizedReleaseArtist.includes(inferredArtist)) {
      score += 18;
    }

    if (releaseBaseProbability > 0) {
      score += Math.round(releaseBaseProbability * 0.8);
    }

    if (expectedTrackCount > 0 && releaseTrackCount > 0) {
      const trackCountDifference = Math.abs(expectedTrackCount - releaseTrackCount);
      if (trackCountDifference === 0) {
        score += 72;
      } else if (trackCountDifference === 1) {
        score += 36;
      } else if (trackCountDifference === 2) {
        score += 10;
      } else {
        score -= 40;
      }
    }

    if (localTrackDurations.length > 0 && releaseTrackDurations.length > 0) {
      const comparableTrackCount = Math.min(localTrackDurations.length, releaseTrackDurations.length);
      const sequenceDurationMatches = localTrackDurations
        .slice(0, comparableTrackCount)
        .filter((duration, index) => Math.abs(duration - releaseTrackDurations[index]) <= 4).length;
      const sortedLocalDurations = [...localTrackDurations].sort((durationA, durationB) => durationA - durationB);
      const sortedReleaseDurations = [...releaseTrackDurations].sort((durationA, durationB) => durationA - durationB);
      const sortedDurationMatches = sortedLocalDurations
        .slice(0, comparableTrackCount)
        .filter((duration, index) => Math.abs(duration - sortedReleaseDurations[index]) <= 4).length;
      const releaseTotalDuration = releaseTrackDurations.reduce((sum, duration) => sum + duration, 0);
      const totalDurationDifference = Math.abs(localTotalTrackDuration - releaseTotalDuration);
      const durationMatchQuality = Math.max(sequenceDurationMatches, sortedDurationMatches) / comparableTrackCount;

      score += Math.round(durationMatchQuality * 56);
      if (totalDurationDifference <= 20) {
        score += 42;
      } else if (totalDurationDifference <= 60) {
        score += 24;
      } else if (totalDurationDifference <= 120) {
        score += 8;
      } else {
        score -= 30;
      }
    } else if (expectedTrackCount > 0) {
      score -= 35;
    }

    return score;
  }, [inferredArtist, isGenericCdName, localTotalTrackDuration, localTrackDurations, normalizedCdName]);

  const getDiscogsCdMetadataCache = useCallback((): DiscogsCdMetadataCache => {
    const serializedCache = localStorage.getItem(DISCOS_CD_METADATA_CACHE_KEY);
    if (!serializedCache) {
      return {};
    }

    try {
      return JSON.parse(serializedCache) as DiscogsCdMetadataCache;
    } catch (_error) {
      return {};
    }
  }, []);

  const persistDiscogsMetadataForCurrentCd = useCallback((release: DiscogsRelease, titleQuery: string, artistQuery: string) => {
    if (!currentCdMetadataCacheKey) {
      return;
    }

    const existingCache = getDiscogsCdMetadataCache();
    const mergedCache = {
      ...existingCache,
      [currentCdMetadataCacheKey]: {
        release,
        titleQuery,
        artistQuery,
        updatedAt: Date.now(),
      },
    };
    const trimmedEntries = Object.entries(mergedCache)
      .sort((entryA, entryB) => (entryB[1].updatedAt || 0) - (entryA[1].updatedAt || 0))
      .slice(0, DISCOS_CD_METADATA_CACHE_MAX_ENTRIES);
    const trimmedCache = trimmedEntries.reduce((cache, [cacheKey, cacheEntry]) => ({
      ...cache,
      [cacheKey]: cacheEntry,
    }), {} as DiscogsCdMetadataCache);

    localStorage.setItem(DISCOS_CD_METADATA_CACHE_KEY, JSON.stringify(trimmedCache));
  }, [currentCdMetadataCacheKey, getDiscogsCdMetadataCache]);

  const searchDiscogsReleases = useCallback(async (
    queryInput: string,
    artistInput: string,
    options?: {
      showNotFoundMessage?: boolean;
      allowAutoFill?: boolean;
      openDialogOnAmbiguous?: boolean;
      showAmbiguousHint?: boolean;
      forceOpenDialog?: boolean;
      skipDialogWhenDismissed?: boolean;
    },
  ) => {
    if (!discogsToken) {
      return;
    }

    const query = (queryInput || '').trim();
    if (!query) {
      return;
    }

    const artist = (artistInput || '').trim();
    const releases = await IPCRenderer.sendAsyncMessage(IPCCommChannel.DeviceSearchDiscogsReleases, {
      token: discogsToken,
      query,
      artist: artist || undefined,
    }) as DiscogsRelease[];

    if (!releases.length) {
      setDiscogsReleases([]);
      setDiscogsReleaseProbabilityById({});
      setSelectedDiscogsRelease(null);
      setSelectedDiscogsReleaseId('');
      setShowDiscogsSelectionDialog(false);
      setHasDiscogsMetadata(false);
      if (options?.showNotFoundMessage) {
        setStatusMessage(I18nService.getString('message_audio_cd_discogs_no_results'));
      }
      return;
    }

    const detailedReleaseCandidates = await Promise.all(releases.slice(0, 16).map(async (release) => {
      try {
        const detailedRelease = await IPCRenderer.sendAsyncMessage(IPCCommChannel.DeviceGetDiscogsRelease, {
          token: discogsToken,
          releaseId: release.id,
        }) as DiscogsRelease;
        return detailedRelease;
      } catch (_error) {
        return release;
      }
    }));

    const expectedTrackCount = tracks.length;
    const rankedReleases = detailedReleaseCandidates
      .map(release => ({
        release,
        score: scoreDiscogsRelease(release, expectedTrackCount),
      }))
      .sort((a, b) => b.score - a.score);

    const rankedReleasesOnly = rankedReleases.map(entry => entry.release);
    const rankedReleaseIds = new Set(rankedReleasesOnly.map(release => release.id));
    const remainingReleases = releases.filter(release => !rankedReleaseIds.has(release.id));
    const nextReleases = [...rankedReleasesOnly, ...remainingReleases];
    const rankedProbabilityById = calculateReleaseProbabilityById(rankedReleases);
    const releaseProbabilityById = nextReleases.reduce((allProbabilities, release) => {
      const rankedProbability = rankedProbabilityById[release.id];
      if (typeof rankedProbability === 'number') {
        return {
          ...allProbabilities,
          [release.id]: rankedProbability,
        };
      }

      if (typeof release.probability === 'number') {
        return {
          ...allProbabilities,
          [release.id]: release.probability,
        };
      }

      return allProbabilities;
    }, {} as Record<number, number>);
    const bestRelease = rankedReleases[0]?.release;
    const isClearlyIdentified = isClearlyIdentifiedRelease(rankedReleases);

    setDiscogsReleases(nextReleases);
    setDiscogsReleaseProbabilityById(releaseProbabilityById);

    if (options?.allowAutoFill && isClearlyIdentified && bestRelease) {
      setSelectedDiscogsRelease(bestRelease);
      setSelectedDiscogsReleaseId(bestRelease.id);
      setShowDiscogsSelectionDialog(false);
      setHasDiscogsMetadata(true);
      persistDiscogsMetadataForCurrentCd(
        bestRelease,
        query,
        artist,
      );
      return;
    }

    setSelectedDiscogsRelease(null);
    setSelectedDiscogsReleaseId(bestRelease?.id || nextReleases[0]?.id || '');
    setHasDiscogsMetadata(false);

    const autoDialogSuppressed = options?.skipDialogWhenDismissed
      && dismissedAutoDialogCdKeyRef.current === currentCdKey;
    const shouldOpenDialog = !!options?.forceOpenDialog
      || (!!options?.openDialogOnAmbiguous && nextReleases.length > 0);
    if (shouldOpenDialog && !autoDialogSuppressed) {
      setShowDiscogsSelectionDialog(true);
      setStatusMessage(I18nService.getString('message_audio_cd_discogs_suggestions_found'));
      return;
    }

    if (options?.showAmbiguousHint && nextReleases.length > 0) {
      setStatusMessage(I18nService.getString('message_audio_cd_discogs_multiple_results'));
    }
  }, [
    calculateReleaseProbabilityById,
    discogsToken,
    isClearlyIdentifiedRelease,
    persistDiscogsMetadataForCurrentCd,
    scoreDiscogsRelease,
    tracks.length,
    currentCdKey,
  ]);

  useEffect(() => {
    if (!audioCd?.present) {
      autoDiscogsLookupKeyRef.current = '';
      dismissedAutoDialogCdKeyRef.current = '';
      hydratedDiscogsCacheKeyRef.current = '';
      setDiscogsSearchTitle('');
      setDiscogsSearchArtist('');
      setHasDiscogsMetadata(false);
      return;
    }

    setDiscogsSearchTitle(audioCd?.name || '');
    setDiscogsSearchArtist(inferredArtistQuery);
  }, [audioCd?.name, audioCd?.path, audioCd?.present, inferredArtistQuery]);

  useEffect(() => {
    MediaProviderService
      .getMediaProviderSettings(MediaLocalConstants.Provider)
      .then((settings) => {
        setImportDirectory(settings?.cd_import?.output_directory || '');
        setNamingTemplate(settings?.cd_import?.naming_template || '<Artist> - <Album-Title> (<Year>)');
        setDiscogsToken(settings?.cd_import?.discogs_token || '');
      })
      .catch(() => {
        setImportDirectory('');
        setNamingTemplate('<Artist> - <Album-Title> (<Year>)');
        setDiscogsToken('');
      });
  }, []);

  useEffect(() => {
    if (audioCd?.present) {
      const cdPath = audioCd.path || '';
      IPCRenderer.sendAsyncMessage(IPCCommChannel.DeviceGetAudioCdTracks)
        .then((files: { name: string, path: string, duration?: number }[]) => {
          const dummyArtist: IMediaArtist = {
            id: 'audio-cd-artist',
            provider: MediaLocalConstants.Provider,
            provider_id: 'audio-cd-artist',
            sync_timestamp: Date.now(),
            artist_name: I18nService.getString('label_audio_cd_unknown_artist'),
          };
          const dummyAlbum: IMediaAlbum = {
            id: 'audio-cd-album',
            provider: MediaLocalConstants.Provider,
            provider_id: 'audio-cd-album',
            sync_timestamp: Date.now(),
            album_name: audioCd.name || I18nService.getString('label_audio_cd_title'),
            album_artist_id: dummyArtist.id,
            album_artist: dummyArtist,
          };

          const mediaTracks: IMediaTrack[] = files.map((file, index) => ({
            id: CryptoService.sha256(file.path),
            provider: MediaLocalConstants.Provider,
            provider_id: CryptoService.sha256(file.path),
            sync_timestamp: Date.now(),
            track_name: file.name,
            track_number: index + 1,
            track_duration: file.duration || 0,
            track_artist_ids: [dummyArtist.id],
            track_album_id: dummyAlbum.id,
            track_album: dummyAlbum,
            track_artists: [dummyArtist],
            extra: {
              file_path: file.path,
              file_source: 'audio-cd',
            },
          }));

          setTracks(mediaTracks);
        })
        .catch(() => {
          setTracks([]);
          setDiscogsReleaseProbabilityById({});
          autoDiscogsLookupKeyRef.current = '';
          hydratedDiscogsCacheKeyRef.current = '';
        });

      if (!cdPath) {
        autoDiscogsLookupKeyRef.current = '';
        hydratedDiscogsCacheKeyRef.current = '';
      }
    } else {
      setTracks([]);
      setDiscogsReleases([]);
      setDiscogsReleaseProbabilityById({});
      setSelectedDiscogsRelease(null);
      setSelectedDiscogsReleaseId('');
      setShowDiscogsSelectionDialog(false);
      setStatusMessage('');
      setHasDiscogsMetadata(false);
      autoDiscogsLookupKeyRef.current = '';
      dismissedAutoDialogCdKeyRef.current = '';
      hydratedDiscogsCacheKeyRef.current = '';
    }
  }, [audioCd?.name, audioCd?.path, audioCd?.present]);

  useEffect(() => {
    if (!audioCd?.present || !hasTracks || !currentCdMetadataCacheKey) {
      return;
    }

    if (hydratedDiscogsCacheKeyRef.current === currentCdMetadataCacheKey) {
      return;
    }
    hydratedDiscogsCacheKeyRef.current = currentCdMetadataCacheKey;

    const cache = getDiscogsCdMetadataCache();
    const cachedEntry = cache[currentCdMetadataCacheKey];
    if (!cachedEntry?.release) {
      return;
    }

    setSelectedDiscogsRelease(cachedEntry.release);
    setSelectedDiscogsReleaseId(cachedEntry.release.id);
    setDiscogsReleases([cachedEntry.release]);
    setDiscogsReleaseProbabilityById({
      [cachedEntry.release.id]: 100,
    });
    setDiscogsSearchTitle(cachedEntry.titleQuery || audioCd.name || '');
    setDiscogsSearchArtist(cachedEntry.artistQuery || inferredArtistQuery);
    setHasDiscogsMetadata(true);
    setShowDiscogsSelectionDialog(false);
    setStatusMessage(I18nService.getString('message_audio_cd_cached_metadata_loaded'));
    autoDiscogsLookupKeyRef.current = currentCdKey;
  }, [
    audioCd?.name,
    audioCd?.present,
    currentCdKey,
    currentCdMetadataCacheKey,
    getDiscogsCdMetadataCache,
    hasTracks,
    inferredArtistQuery,
  ]);

  useEffect(() => {
    if (!audioCd?.present || !discogsToken || !audioCd.name || !hasTracks) {
      return;
    }

    if (hasDiscogsMetadata && selectedDiscogsRelease) {
      return;
    }

    if (autoDiscogsLookupKeyRef.current === currentCdKey) {
      return;
    }
    autoDiscogsLookupKeyRef.current = currentCdKey;

    setIsSearchingDiscogs(true);
    searchDiscogsReleases(audioCd.name, '', {
      allowAutoFill: false,
      forceOpenDialog: true,
      skipDialogWhenDismissed: true,
    })
      .catch(() => {
        setDiscogsReleases([]);
        setDiscogsReleaseProbabilityById({});
        setSelectedDiscogsRelease(null);
        setSelectedDiscogsReleaseId('');
        setShowDiscogsSelectionDialog(false);
        setHasDiscogsMetadata(false);
        autoDiscogsLookupKeyRef.current = '';
      })
      .finally(() => {
        setIsSearchingDiscogs(false);
      });
  }, [
    audioCd?.name,
    audioCd?.present,
    currentCdKey,
    discogsToken,
    hasDiscogsMetadata,
    hasTracks,
    searchDiscogsReleases,
    selectedDiscogsRelease,
  ]);

  const refreshDiscogsSearch = useCallback(async () => {
    if (!discogsToken || !(discogsSearchTitle || audioCd?.name)) {
      return;
    }

    setIsSearchingDiscogs(true);
    setStatusMessage('');

    try {
      await searchDiscogsReleases(
        discogsSearchTitle || audioCd?.name || '',
        discogsSearchArtist || inferredArtistQuery,
        {
          showNotFoundMessage: true,
          allowAutoFill: true,
          openDialogOnAmbiguous: true,
        },
      );
    } catch (error) {
      setStatusMessage((error as Error).message || I18nService.getString('message_audio_cd_discogs_search_failed'));
    } finally {
      setIsSearchingDiscogs(false);
    }
  }, [
    audioCd?.name,
    discogsSearchArtist,
    discogsSearchTitle,
    discogsToken,
    inferredArtistQuery,
    searchDiscogsReleases,
  ]);

  const loadDiscogsRelease = useCallback(async (releaseId: number) => {
    if (!discogsToken || !releaseId) {
      return null;
    }

    setIsSearchingDiscogs(true);
    try {
      const release = await IPCRenderer.sendAsyncMessage(IPCCommChannel.DeviceGetDiscogsRelease, {
        token: discogsToken,
        releaseId,
      }) as DiscogsRelease;

      setSelectedDiscogsRelease(release);
      setSelectedDiscogsReleaseId(release.id);
      setHasDiscogsMetadata(true);
      persistDiscogsMetadataForCurrentCd(
        release,
        discogsSearchTitle || audioCd?.name || '',
        discogsSearchArtist || inferredArtistQuery,
      );
      return release;
    } catch (error) {
      setStatusMessage((error as Error).message || I18nService.getString('message_audio_cd_discogs_details_failed'));
      return null;
    } finally {
      setIsSearchingDiscogs(false);
    }
  }, [
    audioCd?.name,
    discogsSearchArtist,
    discogsSearchTitle,
    discogsToken,
    inferredArtistQuery,
    persistDiscogsMetadataForCurrentCd,
  ]);

  const importCdAsFlac = useCallback(async () => {
    if (!importDirectory) {
      setStatusMessage(I18nService.getString('message_audio_cd_choose_import_directory'));
      return;
    }

    setIsImporting(true);
    setStatusMessage('');

    try {
      const result = await IPCRenderer.sendAsyncMessage(IPCCommChannel.DeviceImportAudioCd, {
        outputDirectory: importDirectory,
        namingTemplate,
        metadata: selectedDiscogsRelease || {
          title: audioCd?.name || I18nService.getString('label_audio_cd_title'),
          artist: I18nService.getString('label_audio_cd_unknown_artist'),
          tracks: tracks.map(track => ({ title: track.track_name })),
        },
      }) as { count: number; importedDirectory: string };
      setStatusMessage(I18nService.getString('message_audio_cd_import_success', {
        count: result.count,
        importedDirectory: result.importedDirectory,
      }));
    } catch (error) {
      setStatusMessage((error as Error).message || I18nService.getString('message_audio_cd_import_failed'));
    } finally {
      setIsImporting(false);
    }
  }, [audioCd?.name, importDirectory, namingTemplate, selectedDiscogsRelease, tracks]);

  const applyDiscogsReleaseSelection = useCallback(async () => {
    if (!selectedDiscogsReleaseId) {
      return;
    }

    setStatusMessage('');
    const release = await loadDiscogsRelease(Number(selectedDiscogsReleaseId));
    if (release) {
      setShowDiscogsSelectionDialog(false);
      persistDiscogsMetadataForCurrentCd(
        release,
        discogsSearchTitle || audioCd?.name || '',
        discogsSearchArtist || inferredArtistQuery,
      );
    }
  }, [
    audioCd?.name,
    discogsSearchArtist,
    discogsSearchTitle,
    inferredArtistQuery,
    loadDiscogsRelease,
    persistDiscogsMetadataForCurrentCd,
    selectedDiscogsReleaseId,
  ]);

  const discogsTrackArtist = useMemo(() => {
    const artistName = (selectedDiscogsRelease?.artist || '').trim();
    if (!artistName) {
      return null;
    }

    const artistId = CryptoService.sha256(`audio-cd-track-artist::${artistName.toLowerCase()}`);
    return {
      id: artistId,
      provider: MediaLocalConstants.Provider,
      provider_id: artistId,
      sync_timestamp: Date.now(),
      artist_name: artistName,
    } as IMediaArtist;
  }, [selectedDiscogsRelease?.artist]);

  const trackListTracks = useMemo(() => (
    tracks.map((track, index) => {
      const mappedTrackName = selectedDiscogsRelease?.tracks?.[index]?.title || track.track_name;
      if (!discogsTrackArtist) {
        return {
          ...track,
          track_name: mappedTrackName,
        };
      }

      return {
        ...track,
        track_name: mappedTrackName,
        track_artist_ids: [discogsTrackArtist.id],
        track_artists: [discogsTrackArtist],
      };
    })
  ), [discogsTrackArtist, selectedDiscogsRelease?.tracks, tracks]);
  const selectedDiscogsCandidate = useMemo(
    () => discogsReleases.find(release => release.id === selectedDiscogsReleaseId) || null,
    [discogsReleases, selectedDiscogsReleaseId],
  );

  const getTrackId = useCallback((track: IMediaTrack) => track.id, []);
  const audioCdTopbarContainer = document.getElementById('audio-cd-header-controls');
  const audioCdTopbarControls = audioCdTopbarContainer ? ReactDOM.createPortal(
    <div className={cx('audio-cd-topbar-actions')}>
      <Button
        variant={['rounded', 'primary']}
        tooltip={isImporting
          ? I18nService.getString('tooltip_audio_cd_import_running')
          : I18nService.getString('tooltip_audio_cd_import_flac')}
        disabled={!audioCd?.present || isImporting || !hasTracks}
        onButtonSubmit={importCdAsFlac}
      >
        <Icon name={Icons.Import}/>
      </Button>
      <Button
        variant={['rounded', 'outline']}
        tooltip={I18nService.getString('tooltip_audio_cd_select_metadata')}
        disabled={!audioCd?.present || isSearchingDiscogs || !discogsToken || !hasTracks}
        onButtonSubmit={() => {
          setShowDiscogsSelectionDialog(true);
        }}
      >
        <Icon name={Icons.Search}/>
      </Button>
    </div>,
    audioCdTopbarContainer,
  ) : null;

  if (!audioCd?.present) {
    return (
      <div className={cx('audio-cd-empty')}>
        {audioCdTopbarControls}
        <h1>{I18nService.getString('label_audio_cd_title')}</h1>
        <p>{I18nService.getString('label_audio_cd_not_detected')}</p>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {audioCdTopbarControls}
      <div className={cx('audio-cd-header')}>
        <div className={cx('audio-cd-header-content')}>
          <div className={cx('audio-cd-cover-column')}>
            <MediaCoverPicture
              className={cx('audio-cd-cover')}
              mediaPicture={coverPicture}
              mediaPictureAltText={selectedDiscogsRelease?.title || audioCd.name || I18nService.getString('label_audio_cd_title')}
              mediaCoverPlaceholderIcon={Icons.AlbumPlaceholder}
            />
          </div>
          <div className={cx('audio-cd-info-column')}>
            <div className={cx('audio-cd-label')}>
              {I18nService.getString('label_audio_cd_title')}
            </div>
            <div className={cx('audio-cd-name')}>
              {selectedDiscogsRelease?.title || audioCd.name || I18nService.getString('label_audio_cd_title')}
            </div>
            <div className={cx('audio-cd-meta')}>
              {(selectedDiscogsRelease?.artist || tracks.length > 0) && (
                <Text>
                  <MediaArtistLink
                    mediaArtist={{
                      id: 'audio-cd-artist',
                      provider: MediaLocalConstants.Provider,
                      provider_id: 'audio-cd-artist',
                      sync_timestamp: Date.now(),
                      artist_name: discogsArtistName,
                    }}
                  />
                </Text>
              )}
            </div>
            <div className={cx('audio-cd-meta')}>
              {tracks.length}
              &nbsp;
              {I18nService.getString('label_audio_cd_tracks')}
              {hasDiscogsMetadata && selectedDiscogsRelease?.year ? ` · ${selectedDiscogsRelease.year}` : ''}
              {hasDiscogsMetadata && selectedDiscogsRelease?.genre ? ` · ${selectedDiscogsRelease.genre}` : ''}
            </div>
          </div>
        </div>
      </div>

      <Modal
        show={showDiscogsSelectionDialog}
        onHide={() => {
          dismissedAutoDialogCdKeyRef.current = currentCdKey;
          setShowDiscogsSelectionDialog(false);
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>{I18nService.getString('label_audio_cd_select_cd')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className={cx('audio-cd-dialog-text')}>
            {I18nService.getString('label_audio_cd_dialog_description')}
          </p>
          <div className={cx('audio-cd-search-inputs')}>
            <Form.Group className={cx('audio-cd-input-group')}>
              <Form.Label>{I18nService.getString('label_audio_cd_search_artist')}</Form.Label>
              <Form.Control
                value={discogsSearchArtist}
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  setDiscogsSearchArtist(event.target.value);
                }}
                placeholder={I18nService.getString('placeholder_audio_cd_search_artist')}
              />
            </Form.Group>
            <Form.Group className={cx('audio-cd-input-group')}>
              <Form.Label>{I18nService.getString('label_audio_cd_search_album')}</Form.Label>
              <Form.Control
                value={discogsSearchTitle}
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  setDiscogsSearchTitle(event.target.value);
                }}
                placeholder={I18nService.getString('placeholder_audio_cd_search_album')}
              />
            </Form.Group>
          </div>
          <div className={cx('audio-cd-dialog-actions')}>
            <Button
              icon={Icons.Search}
              disabled={isSearchingDiscogs || !discogsToken || !discogsSearchTitle.trim()}
              onButtonSubmit={refreshDiscogsSearch}
            >
              {I18nService.getString('button_audio_cd_confirm_search')}
            </Button>
          </div>
          <div className={cx('audio-cd-dialog-summary')}>
            {selectedDiscogsCandidate ? (
              <>
                {I18nService.getString('label_audio_cd_preselected')}
                {' '}
                {selectedDiscogsCandidate.artist ? `${selectedDiscogsCandidate.artist} - ` : ''}
                {selectedDiscogsCandidate.title}
                {discogsReleaseProbabilityById[selectedDiscogsCandidate.id]
                  ? ` (${discogsReleaseProbabilityById[selectedDiscogsCandidate.id]}%)`
                  : ''}
              </>
            ) : (
              <>{I18nService.getString('label_audio_cd_no_results_found')}</>
            )}
          </div>
          <div className={cx('audio-cd-release-list')}>
            {discogsReleases.map((release) => {
              const probability = discogsReleaseProbabilityById[release.id];
              const isSelected = release.id === selectedDiscogsReleaseId;
              return (
                <button
                  type="button"
                  key={release.id}
                  className={cx('audio-cd-release-item', { selected: isSelected })}
                  onClick={() => {
                    setSelectedDiscogsReleaseId(release.id);
                  }}
                >
                  <div className={cx('audio-cd-release-cover')}>
                    {release.cover_image ? (
                      <img
                        src={release.cover_image}
                        alt={`${release.title} Cover`}
                        className={cx('audio-cd-release-cover-image')}
                      />
                    ) : (
                      <Icon name={Icons.AlbumPlaceholder}/>
                    )}
                  </div>
                  <div className={cx('audio-cd-release-content')}>
                    <div className={cx('audio-cd-release-title')}>
                      {release.artist ? `${release.artist} - ` : ''}
                      {release.title}
                    </div>
                    <div className={cx('audio-cd-release-meta')}>
                      {release.year ? `${release.year}` : I18nService.getString('label_audio_cd_unknown_year')}
                      {probability
                        ? ` · ${I18nService.getString('label_audio_cd_probability', { probability })}`
                        : ''}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            onButtonSubmit={() => {
              dismissedAutoDialogCdKeyRef.current = currentCdKey;
              setShowDiscogsSelectionDialog(false);
            }}
          >
            {I18nService.getString('button_dialog_cancel')}
          </Button>
          <Button
            disabled={!selectedDiscogsReleaseId || isSearchingDiscogs}
            onButtonSubmit={applyDiscogsReleaseSelection}
          >
            {I18nService.getString('button_audio_cd_select')}
          </Button>
        </Modal.Footer>
      </Modal>

      {statusMessage && (
        <div className={cx('audio-cd-status')}>
          {statusMessage}
        </div>
      )}

      <div className={cx('audio-cd-tracklist')}>
        <MediaTrackList
          mediaTracks={trackListTracks}
          mediaTrackList={{
            id: 'audio-cd-list',
          }}
          getMediaTrackId={getTrackId}
          variant="sideview"
          disableCovers
          disableAlbumLinks
        />
      </div>
    </div>
  );
}

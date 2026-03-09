import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Form, Modal } from 'react-bootstrap';
import { isEmpty, uniqBy } from 'lodash';

import { ModalComponent } from '../../contexts';
import {
  IMediaAlbum,
  IMediaPlaylist,
  IMediaPlaylistSmartMatchMode,
  IMediaPlaylistSmartRuleData,
  IMediaTrack,
} from '../../interfaces';
import {
  I18nService,
  MediaAlbumService,
  MediaPlaylistService,
  MediaTrackService,
} from '../../services';

import { Button } from '../button/button.component';

type WizardStep = 'setup' | 'manual' | 'smart';

type ManualSelectionTab = 'tracks' | 'albums';

type SmartRuleViewModel = IMediaPlaylistSmartRuleData & {
  id: string;
};

type MediaPlaylistWizardResult = {
  createdPlaylist: IMediaPlaylist;
};

export const MediaPlaylistWizardModal: ModalComponent<{
  initialTracks?: IMediaTrack[];
}, MediaPlaylistWizardResult> = (props) => {
  const {
    initialTracks = [],
    onComplete,
  } = props;

  const [step, setStep] = useState<WizardStep>('setup');
  const [playlistName, setPlaylistName] = useState('');
  const [playlistMode, setPlaylistMode] = useState<'manual' | 'smart'>('manual');
  const [query, setQuery] = useState('');
  const [manualTab, setManualTab] = useState<ManualSelectionTab>('tracks');
  const [trackResults, setTrackResults] = useState<IMediaTrack[]>([]);
  const [albumResults, setAlbumResults] = useState<IMediaAlbum[]>([]);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [smartMatchMode, setSmartMatchMode] = useState<IMediaPlaylistSmartMatchMode>('all');
  const [smartRules, setSmartRules] = useState<SmartRuleViewModel[]>([
    { id: 'rule-1', keyword: 'track', pattern: '' },
  ]);
  const [selectedTracksById, setSelectedTracksById] = useState<Record<string, IMediaTrack>>(
    () => initialTracks.reduce((result, track) => ({
      ...result,
      [track.id]: track,
    }), {}),
  );
  const [selectedAlbumsById, setSelectedAlbumsById] = useState<Record<string, IMediaAlbum>>({});

  const selectedTracksCount = Object.keys(selectedTracksById).length;
  const selectedAlbumsCount = Object.keys(selectedAlbumsById).length;

  const hasValidSetup = useMemo(() => !isEmpty(playlistName.trim()), [playlistName]);

  const hasValidSmartRules = useMemo(
    () => smartRules.some(rule => !isEmpty(rule.pattern.trim())),
    [smartRules],
  );

  const handleToggleTrack = useCallback((track: IMediaTrack) => {
    setSelectedTracksById((existing) => {
      if (existing[track.id]) {
        const updated = { ...existing };
        delete updated[track.id];
        return updated;
      }

      return {
        ...existing,
        [track.id]: track,
      };
    });
  }, []);

  const handleToggleAlbum = useCallback((album: IMediaAlbum) => {
    setSelectedAlbumsById((existing) => {
      if (existing[album.id]) {
        const updated = { ...existing };
        delete updated[album.id];
        return updated;
      }

      return {
        ...existing,
        [album.id]: album,
      };
    });
  }, []);

  const handleCreateManualPlaylist = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const selectedTracks = Object.values(selectedTracksById);
      const selectedAlbums = Object.values(selectedAlbumsById);
      const albumTracks = await Promise.all(
        selectedAlbums.map(album => MediaTrackService.getMediaAlbumTracks(album.id)),
      );
      const allTracks = [...selectedTracks, ...albumTracks.flat()];
      const uniqueTracks = uniqBy(allTracks, track => `${track.provider}__${track.provider_id}`);

      const createdPlaylist = await MediaPlaylistService.createMediaPlaylist({
        name: playlistName.trim(),
        tracks: uniqueTracks.map(track => ({
          provider: track.provider,
          provider_id: track.provider_id,
        })),
      });

      onComplete({ createdPlaylist });
    } finally {
      setIsSubmitting(false);
    }
  }, [onComplete, playlistName, selectedAlbumsById, selectedTracksById]);

  const handleCreateSmartPlaylist = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const rules = smartRules
        .map(rule => ({
          keyword: rule.keyword,
          pattern: rule.pattern.trim(),
        }))
        .filter(rule => !isEmpty(rule.pattern));

      const createdPlaylist = await MediaPlaylistService.createIntelligentMediaPlaylist({
        name: playlistName.trim(),
        matchMode: smartMatchMode,
        rules,
      });
      onComplete({ createdPlaylist });
    } finally {
      setIsSubmitting(false);
    }
  }, [onComplete, playlistName, smartMatchMode, smartRules]);

  const handleNext = useCallback(() => {
    if (!hasValidSetup) {
      return;
    }
    setStep(playlistMode === 'manual' ? 'manual' : 'smart');
  }, [hasValidSetup, playlistMode]);

  const handleBack = useCallback(() => {
    setStep('setup');
  }, []);

  useEffect(() => {
    setIsLoadingSearch(true);
    Promise.all([
      MediaTrackService.searchTracksByName(query),
      MediaAlbumService.searchAlbumsByName(query),
    ])
      .then(([tracks, albums]) => {
        setTrackResults(tracks.slice(0, 60));
        setAlbumResults(albums.slice(0, 60));
      })
      .finally(() => {
        setIsLoadingSearch(false);
      });
  }, [query]);

  return (
    <>
      <Modal.Header>
        <Modal.Title>
          {I18nService.getString('label_playlist_wizard_title')}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {step === 'setup' && (
          <div className="d-flex flex-column gap-3">
            <Form.Group>
              <Form.Label>
                {I18nService.getString('label_playlist_name')}
              </Form.Label>
              <Form.Control
                value={playlistName}
                onChange={event => setPlaylistName(event.target.value)}
                type="text"
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>
                {I18nService.getString('label_playlist_wizard_type')}
              </Form.Label>
              <Form.Control
                as="select"
                value={playlistMode}
                onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setPlaylistMode(event.target.value as 'manual' | 'smart')}
              >
                <option value="manual">
                  {I18nService.getString('label_playlist_wizard_type_manual')}
                </option>
                <option value="smart">
                  {I18nService.getString('label_playlist_wizard_type_smart')}
                </option>
              </Form.Control>
            </Form.Group>
          </div>
        )}
        {step === 'manual' && (
          <div className="d-flex flex-column gap-3">
            <Form.Control
              type="text"
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder={I18nService.getString('placeholder_search_input')}
            />
            <div className="d-flex gap-2">
              <Button
                className={manualTab === 'tracks' ? 'primary' : ''}
                onButtonSubmit={() => setManualTab('tracks')}
              >
                {I18nService.getString('search_result_heading_tracks')}
              </Button>
              <Button
                className={manualTab === 'albums' ? 'primary' : ''}
                onButtonSubmit={() => setManualTab('albums')}
              >
                {I18nService.getString('search_result_heading_albums')}
              </Button>
            </div>
            <div style={{ maxHeight: 280, overflowY: 'auto' }}>
              {manualTab === 'tracks' && trackResults.map(track => (
                <Form.Check
                  key={track.id}
                  type="checkbox"
                  id={`track-${track.id}`}
                  checked={!!selectedTracksById[track.id]}
                  onChange={() => handleToggleTrack(track)}
                  label={`${track.track_name} — ${track.track_album.album_name}`}
                />
              ))}
              {manualTab === 'albums' && albumResults.map(album => (
                <Form.Check
                  key={album.id}
                  type="checkbox"
                  id={`album-${album.id}`}
                  checked={!!selectedAlbumsById[album.id]}
                  onChange={() => handleToggleAlbum(album)}
                  label={album.album_name}
                />
              ))}
              {!isLoadingSearch && manualTab === 'tracks' && isEmpty(trackResults) && (
                <div>{I18nService.getString('label_playlists_empty')}</div>
              )}
              {!isLoadingSearch && manualTab === 'albums' && isEmpty(albumResults) && (
                <div>{I18nService.getString('label_playlists_empty')}</div>
              )}
            </div>
            <div>
              {I18nService.getString('label_playlist_wizard_selection_summary', {
                trackCount: selectedTracksCount.toString(),
                albumCount: selectedAlbumsCount.toString(),
              })}
            </div>
          </div>
        )}
        {step === 'smart' && (
          <div className="d-flex flex-column gap-3">
            <Form.Group>
              <Form.Label>
                {I18nService.getString('label_playlist_wizard_match_mode')}
              </Form.Label>
              <Form.Control
                as="select"
                value={smartMatchMode}
                onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setSmartMatchMode(event.target.value as IMediaPlaylistSmartMatchMode)}
              >
                <option value="all">
                  {I18nService.getString('label_playlist_wizard_match_all')}
                </option>
                <option value="any">
                  {I18nService.getString('label_playlist_wizard_match_any')}
                </option>
              </Form.Control>
            </Form.Group>
            {smartRules.map(rule => (
              <div key={rule.id} className="d-flex gap-2 align-items-center">
                <Form.Control
                  as="select"
                  value={rule.keyword}
                  onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                    const keyword = event.target.value as IMediaPlaylistSmartRuleData['keyword'];
                    setSmartRules(existing => existing.map(item => (item.id === rule.id ? {
                      ...item,
                      keyword,
                    } : item)));
                  }}
                >
                  <option value="track">{I18nService.getString('label_playlist_wizard_keyword_track')}</option>
                  <option value="album">{I18nService.getString('label_playlist_wizard_keyword_album')}</option>
                  <option value="artist">{I18nService.getString('label_playlist_wizard_keyword_artist')}</option>
                  <option value="genre">{I18nService.getString('label_playlist_wizard_keyword_genre')}</option>
                  <option value="path">{I18nService.getString('label_playlist_wizard_keyword_path')}</option>
                </Form.Control>
                <Form.Control
                  type="text"
                  value={rule.pattern}
                  onChange={(event) => {
                    const pattern = event.target.value;
                    setSmartRules(existing => existing.map(item => (item.id === rule.id ? {
                      ...item,
                      pattern,
                    } : item)));
                  }}
                  placeholder={I18nService.getString('label_playlist_wizard_pattern_placeholder')}
                />
                <Button
                  disabled={smartRules.length <= 1}
                  onButtonSubmit={() => {
                    setSmartRules(existing => existing.filter(item => item.id !== rule.id));
                  }}
                >
                  {I18nService.getString('label_playlist_wizard_remove_rule')}
                </Button>
              </div>
            ))}
            <Button
              onButtonSubmit={() => {
                setSmartRules(existing => [...existing, {
                  id: `rule-${Date.now()}-${existing.length}`,
                  keyword: 'track',
                  pattern: '',
                }]);
              }}
            >
              {I18nService.getString('label_playlist_wizard_add_rule')}
            </Button>
            <div>
              {I18nService.getString('label_playlist_wizard_pattern_help')}
            </div>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button
          disabled={isSubmitting}
          onButtonSubmit={() => onComplete()}
        >
          {I18nService.getString('button_dialog_cancel')}
        </Button>
        {step !== 'setup' && (
          <Button
            disabled={isSubmitting}
            onButtonSubmit={handleBack}
          >
            {I18nService.getString('label_playlist_wizard_back')}
          </Button>
        )}
        {step === 'setup' && (
          <Button
            className="primary"
            disabled={!hasValidSetup || isSubmitting}
            onButtonSubmit={handleNext}
          >
            {I18nService.getString('label_playlist_wizard_next')}
          </Button>
        )}
        {step === 'manual' && (
          <Button
            className="primary"
            disabled={isSubmitting}
            onButtonSubmit={handleCreateManualPlaylist}
          >
            {I18nService.getString('button_dialog_confirm')}
          </Button>
        )}
        {step === 'smart' && (
          <Button
            className="primary"
            disabled={isSubmitting || !hasValidSmartRules}
            onButtonSubmit={handleCreateSmartPlaylist}
          >
            {I18nService.getString('button_dialog_confirm')}
          </Button>
        )}
      </Modal.Footer>
    </>
  );
};

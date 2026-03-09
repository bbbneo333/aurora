import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Form, Modal } from 'react-bootstrap';

import { ModalComponent } from '../../contexts';
import { IPodcastDirectoryEntry, IPodcastDirectorySource } from '../../interfaces';
import { I18nService, PodcastService } from '../../services';

import { Button } from '../button/button.component';

export const MediaPodcastSubscribeModal: ModalComponent = ({ onComplete }) => {
  const [query, setQuery] = useState('');
  const [publisher, setPublisher] = useState('');
  const [genre, setGenre] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [source, setSource] = useState<IPodcastDirectorySource>('global');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<IPodcastDirectoryEntry[]>([]);
  const [subscribingId, setSubscribingId] = useState('');
  const requestIdRef = useRef(0);

  const canSearch = useMemo(() => query.trim().length >= 2, [query]);

  const runSearch = async () => {
    if (!canSearch) {
      return;
    }
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setIsSearching(true);
    try {
      const entries = await PodcastService.searchPodcastDirectory({
        query: query.trim(),
        publisher: publisher.trim(),
        genre: genre.trim(),
        minRating,
        source,
      });
      if (requestIdRef.current === requestId) {
        setResults(entries.slice(0, 80));
      }
    } finally {
      if (requestIdRef.current === requestId) {
        setIsSearching(false);
      }
    }
  };

  useEffect(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setIsSearching(true);

    let browseQueries = ['podcast', 'news', 'technology'];
    if (source === 'de') {
      browseQueries = ['podcast', 'nachrichten', 'wissen'];
    } else if (source === 'eu') {
      browseQueries = ['podcast', 'news', 'europa', 'actualités', 'tecnologia'];
    }

    Promise.all(browseQueries.map(browseQuery => PodcastService.searchPodcastDirectory({
      query: browseQuery,
      source,
      minRating: 0,
    }).catch(() => [])))
      .then((entryLists) => {
        if (requestIdRef.current !== requestId) {
          return;
        }
        const merged = entryLists.flat();
        const deduplicated = merged.filter((entry, index) => merged.findIndex(candidate => candidate.id === entry.id) === index);
        setResults(deduplicated.slice(0, 80));
      })
      .finally(() => {
        if (requestIdRef.current === requestId) {
          setIsSearching(false);
        }
      });
  }, [source]);

  return (
    <>
      <Modal.Header>
        <Modal.Title>{I18nService.getString('label_podcast_discover_title')}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="d-flex flex-column gap-3">
          <Form.Group>
            <Form.Label>{I18nService.getString('label_podcast_search_name')}</Form.Label>
            <Form.Control
              type="text"
              value={query}
              onChange={event => setQuery(event.target.value)}
              onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  runSearch();
                }
              }}
            />
          </Form.Group>
          <div className="row g-2">
            <div className="col-6">
              <Form.Group>
                <Form.Label>{I18nService.getString('label_podcast_search_publisher')}</Form.Label>
                <Form.Control
                  type="text"
                  value={publisher}
                  onChange={event => setPublisher(event.target.value)}
                />
              </Form.Group>
            </div>
            <div className="col-6">
              <Form.Group>
                <Form.Label>{I18nService.getString('label_podcast_search_genre')}</Form.Label>
                <Form.Control
                  type="text"
                  value={genre}
                  onChange={event => setGenre(event.target.value)}
                />
              </Form.Group>
            </div>
          </div>
          <div className="row g-2">
            <div className="col-6">
              <Form.Group>
                <Form.Label>{I18nService.getString('label_podcast_search_rating')}</Form.Label>
                <Form.Control
                  as="select"
                  value={String(minRating)}
                  onChange={event => setMinRating(Number(event.target.value))}
                >
                  <option value="0">0+</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                  <option value="4">4+</option>
                </Form.Control>
              </Form.Group>
            </div>
            <div className="col-6">
              <Form.Group>
                <Form.Label>{I18nService.getString('label_podcast_search_source')}</Form.Label>
                <Form.Control
                  as="select"
                  value={source}
                  onChange={event => setSource(event.target.value as IPodcastDirectorySource)}
                >
                  <option value="global">{I18nService.getString('label_podcast_source_global')}</option>
                  <option value="eu">{I18nService.getString('label_podcast_source_eu')}</option>
                  <option value="de">{I18nService.getString('label_podcast_source_de')}</option>
                </Form.Control>
              </Form.Group>
            </div>
          </div>
          <Button
            variant={['primary']}
            disabled={!canSearch || isSearching}
            onButtonSubmit={() => {
              runSearch();
            }}
          >
            {I18nService.getString('button_podcast_search')}
          </Button>
          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {results.length === 0 && !isSearching && (
              <div>{I18nService.getString('label_podcast_results_empty')}</div>
            )}
            {results.map(result => (
              <div key={result.id} className="d-flex align-items-center gap-2 py-2 border-bottom">
                {result.imageUrl && (
                  <img
                    src={result.imageUrl}
                    alt={result.title}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 8,
                      objectFit: 'cover',
                    }}
                  />
                )}
                <div className="flex-fill">
                  <div>{result.title}</div>
                  <div style={{ fontSize: '12px', opacity: 0.8 }}>
                    {result.publisher || '-'}
                    {result.genre ? ` • ${result.genre}` : ''}
                    {result.rating > 0 ? ` • ${result.rating.toFixed(1)}` : ''}
                  </div>
                </div>
                <Button
                  variant={['primary']}
                  style={{ color: '#fff' }}
                  disabled={subscribingId === result.id}
                  onButtonSubmit={() => {
                    setSubscribingId(result.id);
                    PodcastService.subscribeToPodcast(result)
                      .finally(() => setSubscribingId(''));
                  }}
                >
                  {I18nService.getString('button_podcast_subscribe')}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant={['outline']}
          onButtonSubmit={() => onComplete()}
        >
          {I18nService.getString('button_dialog_cancel')}
        </Button>
      </Modal.Footer>
    </>
  );
};

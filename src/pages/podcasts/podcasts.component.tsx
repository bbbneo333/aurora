import React, { useEffect, useMemo, useState } from 'react';
import classNames from 'classnames/bind';

import { Button, Icon, MediaPodcastSubscribeModal } from '../../components';
import { MediaPodcastSideView } from '../../components/media-sideview/media-sideview.component';
import { useModal } from '../../contexts';
import { IPodcastSubscription } from '../../interfaces';
import { Icons } from '../../constants';
import { I18nService, PodcastService } from '../../services';

import styles from './podcasts.component.css';

const cx = classNames.bind(styles);

function usePodcastSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<IPodcastSubscription[]>(() => PodcastService.getSubscriptions());

  useEffect(() => {
    const updateSubscriptions = () => {
      setSubscriptions(PodcastService.getSubscriptions());
    };
    const unsubscribe = PodcastService.subscribe(updateSubscriptions);
    updateSubscriptions();
    return () => unsubscribe();
  }, []);

  return subscriptions;
}

export function PodcastsPage() {
  const subscriptions = usePodcastSubscriptions();
  const [selectedPodcastId, setSelectedPodcastId] = useState<string | undefined>();

  useEffect(() => {
    PodcastService.refreshSubscriptions().catch(() => undefined);
  }, []);

  const subscriptionsSorted = useMemo(() => [...subscriptions].sort((left, right) => {
    if (left.hasNewEpisodes === right.hasNewEpisodes) {
      return left.title.localeCompare(right.title);
    }
    return left.hasNewEpisodes ? -1 : 1;
  }), [subscriptions]);

  return (
    <div className={cx('podcasts-page')}>
      {subscriptionsSorted.length === 0 && (
        <div className={cx('podcasts-empty')}>
          {I18nService.getString('label_podcasts_empty')}
        </div>
      )}
      <div className={cx('podcasts-grid')}>
        {subscriptionsSorted.map(subscription => (
          <div
            key={subscription.id}
            className={cx('podcast-card')}
            role="button"
            tabIndex={0}
            onClick={() => setSelectedPodcastId(subscription.id)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setSelectedPodcastId(subscription.id);
              }
            }}
          >
            <div className={cx('podcast-cover-wrapper')}>
              {subscription.imageUrl ? (
                <img
                  src={subscription.imageUrl}
                  alt={subscription.title}
                  className={cx('podcast-cover')}
                />
              ) : (
                <div className={cx('podcast-cover-placeholder')}>
                  <Icon name={Icons.Podcast}/>
                </div>
              )}
            </div>
            <div className={cx('podcast-meta')}>
              <div className={cx('podcast-title')}>
                {subscription.hasNewEpisodes && <span className={cx('podcast-new-dot')}/>}
                {subscription.title}
              </div>
              <div className={cx('podcast-publisher')}>
                {subscription.publisher || '-'}
              </div>
              <div className={cx('podcast-info')}>
                {subscription.genre || 'Podcast'}
                {subscription.rating > 0 ? ` • ${subscription.rating.toFixed(1)}` : ''}
              </div>
            </div>
          </div>
        ))}
      </div>
      {selectedPodcastId && (
        <MediaPodcastSideView
          podcastId={selectedPodcastId}
          onClose={() => setSelectedPodcastId(undefined)}
        />
      )}
    </div>
  );
}

export function PodcastsHeader() {
  const { showModal } = useModal();

  return (
    <div className={cx('podcasts-header')}>
      <div className={cx('podcasts-header-title')}>
        {I18nService.getString('label_podcasts_header')}
      </div>
      <Button
        className={cx('podcasts-add-button')}
        variant={['rounded', 'outline']}
        tooltip={I18nService.getString('tooltip_podcast_add')}
        onButtonSubmit={() => {
          showModal(MediaPodcastSubscribeModal, {}, {
            dialogClassName: 'podcast-discover-modal-dialog',
            backdropClassName: 'podcast-discover-modal-backdrop',
          });
        }}
      >
        <Icon name={Icons.Add}/>
      </Button>
    </div>
  );
}

import { Routes } from '../../constants';

import { PlayerQueueComponent } from '../player-queue/player-queue.component';

export default [
  {
    path: Routes.PlayerQueue,
    exact: true,
    component: PlayerQueueComponent,
    tHeaderName: 'link_player_queue',
  },
  {
    path: Routes.Player,
    redirect: Routes.PlayerQueue,
  },
];

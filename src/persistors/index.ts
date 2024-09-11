import { IAppStatePersistor } from '../interfaces';

import MediaPlayerPersistor from './media-player.persistor';

const statePersistors: Record<string, IAppStatePersistor> = {
  mediaPlayer: new MediaPlayerPersistor(),
};

export default statePersistors;

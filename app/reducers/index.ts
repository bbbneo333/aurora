import {combineReducers} from 'redux';

import mediaLibrary, {MediaLibraryState} from './media-library.reducer';
import mediaPlayer, {MediaPlayerState} from './media-player.reducer';

export type RootState = {
  mediaLibrary: MediaLibraryState,
  mediaPlayer: MediaPlayerState,
};

export default combineReducers({
  mediaLibrary,
  mediaPlayer,
});

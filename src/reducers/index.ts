import { combineReducers } from 'redux';

import mediaLibrary, { MediaLibraryState } from './media-library.reducer';
import mediaPlayer, { MediaPlayerState } from './media-player.reducer';
import mediaProviderRegistry, { MediaProviderRegistryState } from './media-provider-registry.reducer';
import mediaSettings, { SettingsState } from './media-settings.reducer';

export type RootState = {
  mediaLibrary: MediaLibraryState,
  mediaPlayer: MediaPlayerState,
  mediaProviderRegistry: MediaProviderRegistryState,
  mediaSettings: SettingsState,
};

export default combineReducers({
  mediaLibrary,
  mediaPlayer,
  mediaProviderRegistry,
  mediaSettings,
});

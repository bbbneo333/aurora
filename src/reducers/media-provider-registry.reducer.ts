import {MediaEnums} from '../enums';
import {IMediaProvider} from '../interfaces';

export type MediaProviderRegistryState = {
  mediaProviders: IMediaProvider[];
};

export type MediaProviderRegistryStateAction = {
  type: MediaEnums.MediaProviderRegistryActions,
  data?: any,
};

const mediaProviderRegistryInitialState: MediaProviderRegistryState = {
  mediaProviders: [],
};

export default (state: MediaProviderRegistryState = mediaProviderRegistryInitialState, action: MediaProviderRegistryStateAction): MediaProviderRegistryState => {
  switch (action.type) {
    case MediaEnums.MediaProviderRegistryActions.AddProvider: {
      // data.mediaProvider - provider which needs to be added
      if (state.mediaProviders.find(mediaProvider => mediaProvider.mediaProviderIdentifier === action.data.mediaProvider.mediaProviderIdentifier)) {
        throw new Error(`MediaProviderRegistryReducer encountered error at AddProvider - MediaProvider already exists - ${action.data.mediaProvider.mediaProviderIdentifier}`);
      }

      return {
        ...state,
        mediaProviders: [...state.mediaProviders, action.data.mediaProvider],
      };
    }
    default:
      return state;
  }
};

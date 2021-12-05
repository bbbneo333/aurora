import {createStore, applyMiddleware} from 'redux';

import storeReducer from '../reducers';
import storeComposer from './composer';
import {persistState} from './persistor';

const storeEnhancer = storeComposer(
  applyMiddleware(persistState),
);

export default createStore(
  storeReducer,
  storeEnhancer,
);

import {createStore, compose} from 'redux';

import rootReducer from './reducers';

// setting up redux devtools as enhancer composer (if configured)
// @see - https://github.com/zalmoxisus/redux-devtools-extension#12-advanced-store-setup
const reduxDevtoolsComposer = (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__;

const composer = reduxDevtoolsComposer
  ? reduxDevtoolsComposer({
    // specify extension’s options like name, actionsBlacklist, actionsCreators, serialize...
    // @see - https://github.com/zalmoxisus/redux-devtools-extension/blob/master/docs/API/Arguments.md
  })
  : compose;

const enhancer = composer(
  // specify middlewares here
);

export default createStore(
  rootReducer,
  enhancer,
);

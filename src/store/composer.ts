// setting up redux devtools as enhancer composer (if configured)
// @see - https://github.com/zalmoxisus/redux-devtools-extension#12-advanced-store-setup
import {compose} from 'redux';

const reduxDevtoolsComposer = (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__;

export default reduxDevtoolsComposer
  ? reduxDevtoolsComposer({
    // specify extension’s options like name, actionsBlacklist, actionsCreators, serialize...
    // @see - https://github.com/zalmoxisus/redux-devtools-extension/blob/master/docs/API/Arguments.md
  })
  : compose;

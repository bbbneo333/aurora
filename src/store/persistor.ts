import _ from 'lodash';
import { Dispatch, MiddlewareAPI, Store } from 'redux';

import { IAppStatePersistor } from '../interfaces';
import { RootState } from '../reducers';
import { PromiseUtils } from '../utils';

const debug = require('debug')('app:store:persistor');

const statePersistors: Record<string, IAppStatePersistor> = {};

function saveStateToLocalStorage(key: string, value: any): void {
  localStorage.setItem(`app:state:${key}`, JSON.stringify(value));
}

function loadStateFromLocalStorage(key: string): any {
  const state = localStorage.getItem(`app:state:${key}`);
  return state ? JSON.parse(state) : null;
}

function removeStateFromLocalStorage(key: string): void {
  localStorage.removeItem(`app:state:${key}`);
}

async function saveStateToStorage(state: any, stateKey: string, statePersistor: IAppStatePersistor) {
  try {
    const serializedState = statePersistor?.serialize ? await statePersistor.serialize(state) : state;
    saveStateToLocalStorage(stateKey, serializedState);
  } catch (err) {
    console.error('Encountered an error while saving state', stateKey, state);
    console.error(err);
  }
}

async function loadStateFromStorage(stateKey: string, statePersistor: IAppStatePersistor): Promise<any> {
  try {
    const savedState = loadStateFromLocalStorage(stateKey);
    return statePersistor?.deserialize ? await statePersistor.deserialize(savedState) : savedState;
  } catch (err) {
    console.error('Encountered an error while loading state', stateKey);
    console.error(err);

    return null;
  }
}

async function saveStateForPersistors(state: RootState) {
  await Promise.mapSeries(_.keys(state) as [keyof RootState], async (stateKey: keyof RootState) => {
    const stateValue = state[stateKey];
    const statePersistor = statePersistors[stateKey];

    if (statePersistor) {
      debug('persisting state - %s - %o', stateKey, stateValue);
      await saveStateToStorage(stateValue, stateKey, statePersistor);
    }
  });
}

async function loadAndStateForPersistors(state: RootState) {
  return Promise.mapSeries(_.keys(state) as [keyof RootState], async (stateKey: keyof RootState) => {
    const statePersistor = statePersistors[stateKey];

    if (statePersistor) {
      debug('loading state - %s', stateKey);
      const stateValue = await loadStateFromStorage(stateKey, statePersistor);

      if (stateValue) {
        debug('exhausting state - %s - %o', stateKey, stateValue);

        try {
          const stateExisting = state[stateKey];
          await statePersistor.exhaust(stateExisting, stateValue);
        } catch (err) {
          console.error('Encountered error while exhausting state', stateKey, stateValue);
          console.error(err);
        }
      }
    }
  });
}

const persistStateThrottled = _.throttle(saveStateForPersistors, 500);

export function registerStatePersistor(stateKey: string, statePersistor: IAppStatePersistor) {
  debug('registering state persistor - %s', stateKey);
  statePersistors[stateKey] = statePersistor;
}

export function persistState(store: MiddlewareAPI) {
  return (next: Dispatch) => (action: any) => {
    const result = next(action);
    const state = store.getState();

    persistStateThrottled(state);

    return result;
  };
}

export async function loadState(store: Store): Promise<void> {
  const state = store.getState();
  // persistors have 10 seconds in total to deserialize their states
  // otherwise state is invalidated and app proceeds to boot up as usual
  const stateLoadTimeoutMS = 10000;

  return PromiseUtils
    .resolveWithin(loadAndStateForPersistors(state), stateLoadTimeoutMS)
    .catch((error) => {
      if (error.name === 'PromiseExecutionTimedOut') {
        debug(`loadStateForPersistors took more than ${stateLoadTimeoutMS}, skipping loading state...`);
        return;
      }

      throw error;
    });
}

export function removeStates() {
  Object.keys(statePersistors).forEach((stateKey) => {
    debug('removing state - %s', stateKey);
    removeStateFromLocalStorage(stateKey);
  });
}

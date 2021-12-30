import * as _ from 'lodash';
import {Dispatch, MiddlewareAPI, Store} from 'redux';

import {IAppStatePersistor} from '../interfaces';
import {RootState} from '../reducers';
import {PromiseUtils} from '../utils';

const debug = require('debug')('app:store:persistor');

const statePersistors: Record<string, IAppStatePersistor> = {};

function saveStateToLocalStorage(key: string, value: any) {
  localStorage.setItem(`app:state:${key}`, JSON.stringify(value));
}

function loadStateFromLocalStorage(key: string): any {
  const state = localStorage.getItem(`app:state:${key}`);
  return state ? JSON.parse(state) : null;
}

async function saveStateToStorage(state: any, stateKey: string, statePersistor: IAppStatePersistor) {
  const serializedState = statePersistor?.serialize ? await statePersistor.serialize(state) : state;
  saveStateToLocalStorage(stateKey, serializedState);
}

async function loadStateFromStorage(stateKey: string, statePersistor: IAppStatePersistor): Promise<any> {
  const savedState = loadStateFromLocalStorage(stateKey);
  return statePersistor?.deserialize ? statePersistor.deserialize(savedState) : savedState;
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
        const stateExisting = state[stateKey];
        await statePersistor.exhaust(stateExisting, stateValue);
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

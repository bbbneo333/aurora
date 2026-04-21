import Store from 'electron-store';

import { IAppMain, IAppModule } from '../../interfaces';
import { IPCCommChannel, IPCMain } from '../ipc';

import { ReadStoreOptions } from './types';

export class StoreModule implements IAppModule {
  private app: IAppMain;
  private dataDir = 'Config';
  private stores: Record<string, Store> = {};

  constructor(app: IAppMain) {
    this.app = app;
    this.registerMessageHandlers();
  }

  private registerMessageHandlers() {
    IPCMain.addSyncMessageHandler(IPCCommChannel.StoreRead, this.readStore, this);
    IPCMain.addSyncMessageHandler(IPCCommChannel.StoreWriteKey, this.writeKey, this);
  }

  private readStore(name: string, options?: ReadStoreOptions) {
    const store = new Store({
      name,
      schema: options?.schema,
      cwd: this.app.createDataDir(this.dataDir),
    });

    this.stores[name] = store;

    // @ts-ignore - deserialized store
    return store.store;
  }

  private writeKey(storeName: string, name: string, value: any) {
    const store = this.stores[storeName];
    if (!store) {
      throw new Error(`StoreModule encountered error - Could not find store with name - ${storeName}`);
    }

    // @ts-ignore
    store.set(name, value);

    // @ts-ignore
    return store.store;
  }
}

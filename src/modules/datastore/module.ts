import fs from 'fs';
import path from 'path';

import { IAppMain, IAppModule } from '../../interfaces';
import { IPCCommChannel, IPCMain } from '../ipc';
import { SQLiteDatastore } from './sqlite';
import { DatastoreUtils } from './utils';

import {
  DataStoreFilterData,
  DatastoreOptions,
  DataStoreQueryData,
  DataStoreUpdateData,
} from './types';

const debug = require('debug')('aurora:module:datastore');

export class DatastoreModule implements IAppModule {
  private readonly app: IAppMain;
  private readonly datastoreDataDir = 'Databases';
  private readonly sqliteFilename = 'aurora.sqlite';
  private datastore: SQLiteDatastore;

  constructor(app: IAppMain) {
    this.app = app;
    this.datastore = this.openDatastore();
    this.registerMessageHandlers();
  }

  removeDatastores(): void {
    this.datastore.close();

    // Only remove files owned by the SQLite implementation. Legacy NeDB files
    // are immutable migration sources and must never be changed here.
    [
      this.getSQLitePath(),
      `${this.getSQLitePath()}-wal`,
      `${this.getSQLitePath()}-shm`,
    ].forEach((filename) => {
      try {
        fs.unlinkSync(filename);
      } catch (error: any) {
        if (error.code !== 'ENOENT') throw error;
      }
    });

    this.datastore = this.openDatastore();
  }

  compactDatastores(): void {
    this.datastore.compact();
  }

  private registerMessageHandlers(): void {
    IPCMain.addSyncMessageHandler(IPCCommChannel.DSRegisterDatastore, this.registerDatastore, this);
    IPCMain.addAsyncMessageHandler(IPCCommChannel.DSFind, this.find, this);
    IPCMain.addAsyncMessageHandler(IPCCommChannel.DSFindOne, this.findOne, this);
    IPCMain.addAsyncMessageHandler(IPCCommChannel.DSInsertOne, this.insertOne, this);
    IPCMain.addAsyncMessageHandler(IPCCommChannel.DSUpdate, this.update, this);
    IPCMain.addAsyncMessageHandler(IPCCommChannel.DSUpdateOne, this.updateOne, this);
    IPCMain.addAsyncMessageHandler(IPCCommChannel.DSRemove, this.remove, this);
    IPCMain.addAsyncMessageHandler(IPCCommChannel.DSRemoveOne, this.removeOne, this);
    IPCMain.addAsyncMessageHandler(IPCCommChannel.DSCount, this.count, this);
    IPCMain.addAsyncMessageHandler(IPCCommChannel.DSUpsertOne, this.upsertOne, this);
    IPCMain.addAsyncMessageHandler(IPCCommChannel.DSExecuteOperation, this.executeOperation, this);
  }

  private registerDatastore(datastoreName: string, datastoreOptions: DatastoreOptions = {}): void {
    // Tables and indexes are declared centrally. Keep datastore registration as
    // a compatibility boundary until domain-specific IPC replaces it.
    const schema = this.datastore.getSchema(datastoreName);
    datastoreOptions.indexes?.forEach((index) => {
      if (!schema.columns[index.field]) {
        throw new Error(`Unknown index field for ${datastoreName}: ${index.field}`);
      }
    });
    debug('registerDatastore - registered SQLite table - %s', datastoreName);
  }

  private find(datastoreName: string, datastoreQueryDoc: DataStoreQueryData): any[] {
    return this.datastore.find(datastoreName, datastoreQueryDoc || { filter: {} });
  }

  private findOne(datastoreName: string, datastoreFindDoc: DataStoreFilterData): any | undefined {
    return this.datastore.findOne(datastoreName, datastoreFindDoc);
  }

  private insertOne(datastoreName: string, datastoreInsertDoc: Record<string, any>): any {
    return this.datastore.insert(datastoreName, {
      ...datastoreInsertDoc,
      id: DatastoreUtils.generateId(),
    });
  }

  private update(datastoreName: string, datastoreFindDoc: DataStoreFilterData, datastoreUpdateDoc: object): any[] {
    return this.datastore.update(datastoreName, datastoreFindDoc, datastoreUpdateDoc, true);
  }

  private updateOne(datastoreName: string, datastoreFindDoc: DataStoreFilterData, datastoreUpdateOneDoc: object): any | undefined {
    return this.datastore.update(datastoreName, datastoreFindDoc, datastoreUpdateOneDoc, false);
  }

  private remove(datastoreName: string, datastoreFindDoc: DataStoreFilterData): void {
    this.datastore.remove(datastoreName, datastoreFindDoc, true);
  }

  private removeOne(datastoreName: string, datastoreFindDoc: DataStoreFilterData): void {
    this.datastore.remove(datastoreName, datastoreFindDoc, false);
  }

  private count(datastoreName: string, datastoreFindDoc?: DataStoreFilterData): number {
    return this.datastore.count(datastoreName, datastoreFindDoc);
  }

  private upsertOne(datastoreName: string, datastoreFindDoc: DataStoreFilterData, datastoreUpdateOneDoc: DataStoreUpdateData): any {
    return this.datastore.upsert(datastoreName, datastoreFindDoc, {
      ...datastoreUpdateOneDoc,
      id: DatastoreUtils.generateId(),
    });
  }

  private executeOperation(datastoreName: string, operation: string, operationArgs: unknown): any {
    return this.datastore.executeOperation(datastoreName, operation, operationArgs);
  }

  private openDatastore(): SQLiteDatastore {
    return new SQLiteDatastore(this.getSQLitePath());
  }

  private getSQLitePath(): string {
    const dir = this.app.createDataDir(this.datastoreDataDir);
    return path.join(dir, this.sqliteFilename);
  }
}

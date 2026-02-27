import Datastore from 'nedb-promises';
import fs from 'fs';
import path from 'path';
import _ from 'lodash';

import { IAppMain, IAppModule } from '../../interfaces';
import { IPCCommChannel, IPCMain } from '../ipc';
import { DatastoreUtils } from './utils';

import {
  DataStoreFilterData,
  DatastoreIndex,
  DataStoreInputData,
  DatastoreOptions,
  DataStoreQueryData,
  DataStoreUpdateData,
} from './types';

const debug = require('debug')('aurora:module:datastore');

export class DatastoreModule implements IAppModule {
  private readonly app: IAppMain;
  private readonly datastores: Record<string, Datastore> = {};
  private readonly datastoreDataDir = 'Databases';

  constructor(app: IAppMain) {
    this.app = app;
    this.registerMessageHandlers();
  }

  removeDatastores(): void {
    Object
      .keys(this.datastores)
      .forEach((datastoreName) => {
        const datastore = this.datastores[datastoreName];
        this.removeDatastore(datastore);
      });
  }

  compactDatastores(): void {
    Object
      .keys(this.datastores)
      .forEach((datastoreName) => {
        const datastore = this.datastores[datastoreName];
        this.compactDatastore(datastore);
      });
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
  }

  private removeDatastore(datastore: Datastore): void {
    const datastoreFilename = this.getDatastoreFilename(datastore);
    debug('removeDatastore - attempting to remove datastore file - %s', datastoreFilename);

    try {
      fs.unlinkSync(datastoreFilename);
      debug('removeDatastore - datastore file was removed successfully');
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        console.error('removeDatastore - datastore file does not exists');
      } else {
        throw error;
      }
    }
  }

  private compactDatastore(datastore: Datastore): void {
    const datastoreFilename = this.getDatastoreFilename(datastore);
    debug('compactDatastore - compacting datastore file - %s', datastoreFilename);

    datastore.persistence.compactDatafile();
  }

  private registerDatastore(datastoreName: string, datastoreOptions: DatastoreOptions = {}): void {
    // obtain datastore path and create datastore
    const datastorePath = this.getDatastorePath(datastoreName);
    const datastore = Datastore.create(datastorePath);
    debug('registerDatastore - created datastore - %s at - %s', datastoreName, datastorePath);

    // configure datastore
    datastore.on('error', (_datastore, event: string, error: Error) => {
      console.error('datastore encountered error - %s, event - %s, error - %s', datastoreName, event, error.message);
    });

    if (datastoreOptions.indexes) {
      this.registerDatastoreIndexes(datastore, datastoreOptions.indexes);
    }

    this.datastores[datastoreName] = datastore;
  }

  private registerDatastoreIndexes(datastore: Datastore, datastoreIndexes: DatastoreIndex[]): void {
    datastoreIndexes.forEach((datastoreIndex) => {
      debug('registerDatastoreIndexes - registering index - %o', datastoreIndex);
      datastore.ensureIndex({
        fieldName: datastoreIndex.field,
        unique: datastoreIndex.unique === true,
      });
    });
  }

  private find(datastoreName: string, datastoreQueryDoc: DataStoreQueryData): Promise<any> {
    const datastore = this.getDatastore(datastoreName);
    const cursor = datastore.find(datastoreQueryDoc.filter);

    _.forEach([
      'sort',
      'skip',
      'limit',
    ], (key) => {
      const value = _.get(datastoreQueryDoc, key);

      if (!_.isNil(value)) {
        // @ts-ignore
        cursor[key]?.(value);
      }
    });

    return cursor.exec();
  }

  private findOne(datastoreName: string, datastoreFindDoc: DataStoreFilterData): Promise<any> {
    const datastore = this.getDatastore(datastoreName);
    return datastore.findOne(datastoreFindDoc);
  }

  private insertOne(datastoreName: string, datastoreInsertDoc: DataStoreInputData): Promise<any> {
    const datastore = this.getDatastore(datastoreName);

    // important - id is reserved for datastore
    return datastore.insert({
      ...datastoreInsertDoc,
      id: DatastoreUtils.generateId(),
    });
  }

  private async update(datastoreName: string, datastoreFindDoc: DataStoreFilterData, datastoreUpdateDoc: object): Promise<any> {
    const datastore = this.getDatastore(datastoreName);

    // important - id is reserved for datastore
    return datastore.update(datastoreFindDoc, _.omit(datastoreUpdateDoc, ['$set.id', '$unset.id']), {
      multi: true,
      upsert: false,
      returnUpdatedDocs: true,
    });
  }

  private async updateOne(datastoreName: string, datastoreFindDoc: DataStoreFilterData, datastoreUpdateOneDoc: object): Promise<any> {
    const datastore = this.getDatastore(datastoreName);

    // important - id is reserved for datastore
    return datastore.update(datastoreFindDoc, _.omit(datastoreUpdateOneDoc, ['$set.id', '$unset.id']), {
      multi: false,
      upsert: false,
      returnUpdatedDocs: true,
    });
  }

  private async remove(datastoreName: string, datastoreFindDoc: DataStoreFilterData): Promise<void> {
    const datastore = this.getDatastore(datastoreName);

    await datastore.remove(datastoreFindDoc, {
      multi: true,
    });
  }

  private async removeOne(datastoreName: string, datastoreFindDoc: DataStoreFilterData): Promise<void> {
    const datastore = this.getDatastore(datastoreName);

    await datastore.remove(datastoreFindDoc, {
      multi: false,
    });
  }

  private async count(datastoreName: string, datastoreFindDoc?: DataStoreFilterData): Promise<number> {
    const datastore = this.getDatastore(datastoreName);

    return datastore.count(datastoreFindDoc);
  }

  // nedb does not provide atomic upserts - so we had to resolve to insert/update calls
  // important - make sure datastoreUpdateOneDoc is complete doc, not a partial one
  // otherwise race conditions can cause data corruption
  private async upsertOne(datastoreName: string, datastoreFindDoc: DataStoreFilterData, datastoreUpdateOneDoc: DataStoreUpdateData) {
    const datastore = this.getDatastore(datastoreName);

    try {
      return await datastore.insert({
        ...datastoreUpdateOneDoc,
        id: DatastoreUtils.generateId(),
      });
    } catch (e: any) {
      if (e.errorType === 'uniqueViolated') {
        return datastore.update(datastoreFindDoc, {
          $set: datastoreUpdateOneDoc,
        }, {
          multi: false,
          upsert: false,
          returnUpdatedDocs: true,
        });
      }

      throw e;
    }
  }

  private getDatastore(datastoreName: string): Datastore {
    const datastore = this.datastores[datastoreName];
    if (!datastore) {
      throw new Error(`DatastoreModule encountered error at getDatastore - Could not find datastore for - ${datastoreName}`);
    }
    return datastore;
  }

  private getDatastoreFilename(datastore: Datastore) {
    // for some reason, filename is not declared in types by NeDb
    // @ts-ignore
    return datastore.persistence.filename;
  }

  private getDatastorePath(datastoreName: string): string {
    const dir = this.app.createDataDir(this.datastoreDataDir);
    return path.join(dir, `${datastoreName}.db`);
  }
}

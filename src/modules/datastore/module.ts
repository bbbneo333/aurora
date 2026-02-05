import Datastore from 'nedb-promises';
import fs from 'fs';
import path from 'path';
import _ from 'lodash';

import { IAppMain, IAppModule } from '../../interfaces';
import { IPCCommChannel, IPCMain } from '../ipc';
import { DatastoreUtils } from './utils';
import { DatastoreIndex, DatastoreOptions, DataStoreQueryData } from './types';

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

  private find(datastoreName: string, datastoreQueryDoc: DataStoreQueryData<never>): Promise<any> {
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

  private findOne(datastoreName: string, datastoreFindOneDoc: object): Promise<any> {
    const datastore = this.getDatastore(datastoreName);
    return datastore.findOne(datastoreFindOneDoc);
  }

  private insertOne(datastoreName: string, datastoreInsertDoc: object): Promise<any> {
    const datastore = this.getDatastore(datastoreName);

    // important - id is reserved for datastore
    return datastore.insert({
      ...datastoreInsertDoc,
      id: DatastoreUtils.generateId(),
    });
  }

  private async updateOne(datastoreName: string, datastoreFindOneDoc: object, datastoreUpdateOneDoc: object): Promise<void> {
    const datastore = this.getDatastore(datastoreName);

    // important - id is reserved for datastore
    return datastore.update(datastoreFindOneDoc, _.omit(datastoreUpdateOneDoc, ['$set.id', '$unset.id']), {
      multi: false,
      upsert: false,
      returnUpdatedDocs: true,
    });
  }

  private async remove(datastoreName: string, datastoreFindDoc: object): Promise<void> {
    const datastore = this.getDatastore(datastoreName);

    await datastore.remove(datastoreFindDoc, {
      multi: true,
    });
  }

  private async removeOne(datastoreName: string, datastoreFindOneDoc: object): Promise<void> {
    const datastore = this.getDatastore(datastoreName);

    await datastore.remove(datastoreFindOneDoc, {
      multi: false,
    });
  }

  private async count(datastoreName: string, datastoreFindOneDoc?: object): Promise<number> {
    const datastore = this.getDatastore(datastoreName);

    return datastore.count(datastoreFindOneDoc);
  }

  // important - upsert callers are required to provide their own id
  private async upsertOne(datastoreName: string, datastoreFindOneDoc: object, datastoreUpdateOneDoc: object) {
    const datastore = this.getDatastore(datastoreName);

    return datastore.update(datastoreFindOneDoc, datastoreUpdateOneDoc, {
      multi: false,
      upsert: true,
      returnUpdatedDocs: true,
    });
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

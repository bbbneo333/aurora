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
  private readonly datastoreActiveWrites: Record<string, number> = {};
  private readonly datastoreDataDir = 'Databases';
  private readonly datastoreFileReadWriteMode = 0o600;

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
    this.ensureDatastoreFileWriteAccessSync(datastorePath);
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
    this.setDatastoreFileModeSync(datastore, this.datastoreFileReadWriteMode);
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

  private async insertOne(datastoreName: string, datastoreInsertDoc: DataStoreInputData): Promise<any> {
    const datastore = this.getDatastore(datastoreName);
    return this.withDatastoreWriteAccess(datastore, async () => datastore.insert({
      ..._.omit(datastoreInsertDoc, ['id']),
      id: DatastoreUtils.generateId(),
    }));
  }

  private async update(datastoreName: string, datastoreFindDoc: DataStoreFilterData, datastoreUpdateDoc: object): Promise<any> {
    const datastore = this.getDatastore(datastoreName);
    const sanitizedUpdateDoc = this.sanitizeUpdateDoc(datastoreUpdateDoc);
    const matchingDocs = await datastore.find(datastoreFindDoc);
    if (!matchingDocs.length) {
      return [];
    }

    const changedDocIds = matchingDocs
      .filter(doc => this.wouldDocumentChange(doc, sanitizedUpdateDoc))
      .map((doc: any) => doc.id)
      .filter(Boolean);
    if (!changedDocIds.length) {
      return matchingDocs;
    }

    return this.withDatastoreWriteAccess(datastore, async () => datastore.update({
      id: {
        $in: changedDocIds,
      },
    }, sanitizedUpdateDoc, {
      multi: true,
      upsert: false,
      returnUpdatedDocs: true,
    }));
  }

  private async updateOne(datastoreName: string, datastoreFindDoc: DataStoreFilterData, datastoreUpdateOneDoc: object): Promise<any> {
    const datastore = this.getDatastore(datastoreName);
    const sanitizedUpdateDoc = this.sanitizeUpdateDoc(datastoreUpdateOneDoc);
    const matchingDoc = await datastore.findOne(datastoreFindDoc);
    if (!matchingDoc) {
      return undefined;
    }

    if (!this.wouldDocumentChange(matchingDoc, sanitizedUpdateDoc)) {
      return matchingDoc;
    }

    return this.withDatastoreWriteAccess(datastore, async () => datastore.update(datastoreFindDoc, sanitizedUpdateDoc, {
      multi: false,
      upsert: false,
      returnUpdatedDocs: true,
    }));
  }

  private async remove(datastoreName: string, datastoreFindDoc: DataStoreFilterData): Promise<void> {
    const datastore = this.getDatastore(datastoreName);
    const affectedEntriesCount = await datastore.count(datastoreFindDoc);
    if (!affectedEntriesCount) {
      return;
    }

    await this.withDatastoreWriteAccess(datastore, async () => datastore.remove(datastoreFindDoc, {
      multi: true,
    }));
  }

  private async removeOne(datastoreName: string, datastoreFindDoc: DataStoreFilterData): Promise<void> {
    const datastore = this.getDatastore(datastoreName);
    const affectedEntriesCount = await datastore.count(datastoreFindDoc);
    if (!affectedEntriesCount) {
      return;
    }

    await this.withDatastoreWriteAccess(datastore, async () => datastore.remove(datastoreFindDoc, {
      multi: false,
    }));
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
    const sanitizedUpdateDoc = _.omit(datastoreUpdateOneDoc, ['id']);
    const existingDoc = await datastore.findOne(datastoreFindDoc);

    if (existingDoc) {
      if (!this.wouldDocumentChange(existingDoc, {
        $set: sanitizedUpdateDoc,
      })) {
        return existingDoc;
      }

      return this.withDatastoreWriteAccess(datastore, async () => datastore.update(datastoreFindDoc, {
        $set: sanitizedUpdateDoc,
      }, {
        multi: false,
        upsert: false,
        returnUpdatedDocs: true,
      }));
    }

    try {
      return await this.withDatastoreWriteAccess(datastore, async () => datastore.insert({
        ...sanitizedUpdateDoc,
        id: DatastoreUtils.generateId(),
      }));
    } catch (e: any) {
      if (e.errorType === 'uniqueViolated') {
        return this.withDatastoreWriteAccess(datastore, async () => datastore.update(datastoreFindDoc, {
          $set: sanitizedUpdateDoc,
        }, {
          multi: false,
          upsert: false,
          returnUpdatedDocs: true,
        }));
      }

      throw e;
    }
  }

  private sanitizeUpdateDoc(datastoreUpdateDoc: object): object {
    return _.omit(datastoreUpdateDoc, ['$set.id', '$unset.id']);
  }

  private wouldDocumentChange(existingDoc: Record<string, any>, datastoreUpdateDoc: Record<string, any>): boolean {
    const setUpdateDoc = datastoreUpdateDoc.$set;
    const unsetUpdateDoc = datastoreUpdateDoc.$unset;
    const hasModifierOps = _.isPlainObject(setUpdateDoc) || _.isPlainObject(unsetUpdateDoc);
    if (!hasModifierOps) {
      return !_.isEqual(existingDoc, datastoreUpdateDoc);
    }

    if (_.isPlainObject(setUpdateDoc)) {
      const setKeys = Object.keys(setUpdateDoc);
      if (setKeys.some(key => !_.isEqual(_.get(existingDoc, key), _.get(setUpdateDoc, key)))) {
        return true;
      }
    }

    if (_.isPlainObject(unsetUpdateDoc)) {
      const unsetKeys = Object.keys(unsetUpdateDoc);
      if (unsetKeys.some(key => _.has(existingDoc, key))) {
        return true;
      }
    }

    return false;
  }

  private async withDatastoreWriteAccess<T>(datastore: Datastore, operation: () => Promise<T>): Promise<T> {
    const datastoreFilename = this.getDatastoreFilename(datastore);
    const activeWrites = this.datastoreActiveWrites[datastoreFilename] || 0;
    this.datastoreActiveWrites[datastoreFilename] = activeWrites + 1;
    if (activeWrites === 0) {
      await this.setDatastoreFileMode(datastore, this.datastoreFileReadWriteMode);
    }

    try {
      return await operation();
    } finally {
      const remainingWrites = Math.max(0, (this.datastoreActiveWrites[datastoreFilename] || 1) - 1);
      if (remainingWrites === 0) {
        delete this.datastoreActiveWrites[datastoreFilename];
      } else {
        this.datastoreActiveWrites[datastoreFilename] = remainingWrites;
      }
    }
  }

  private ensureDatastoreFileWriteAccessSync(datastoreFilename: string): void {
    const tempDatastoreFilename = `${datastoreFilename}~`;
    [
      datastoreFilename,
      tempDatastoreFilename,
    ].forEach((filePath) => {
      if (!fs.existsSync(filePath)) {
        return;
      }

      try {
        fs.chmodSync(filePath, this.datastoreFileReadWriteMode);
      } catch (error) {
        debug('ensureDatastoreFileWriteAccessSync - failed for %s: %o', filePath, error);
      }
    });
  }

  private setDatastoreFileModeSync(datastore: Datastore, fileMode: number): void {
    const datastoreFilename = this.getDatastoreFilename(datastore);
    if (!fs.existsSync(datastoreFilename)) {
      return;
    }

    try {
      fs.chmodSync(datastoreFilename, fileMode);
    } catch (error) {
      debug('setDatastoreFileModeSync - failed for %s with mode %o: %o', datastoreFilename, fileMode, error);
    }
  }

  private async setDatastoreFileMode(datastore: Datastore, fileMode: number): Promise<void> {
    const datastoreFilename = this.getDatastoreFilename(datastore);
    const tempDatastoreFilename = `${datastoreFilename}~`;

    try {
      await Promise.all([
        this.setFileModeIfExists(datastoreFilename, fileMode),
        this.setFileModeIfExists(tempDatastoreFilename, fileMode),
      ]);
    } catch (error) {
      debug('setDatastoreFileMode - failed for %s with mode %o: %o', datastoreFilename, fileMode, error);
    }
  }

  private async setFileModeIfExists(filename: string, fileMode: number): Promise<void> {
    if (!fs.existsSync(filename)) {
      return;
    }

    await fs.promises.chmod(filename, fileMode);
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

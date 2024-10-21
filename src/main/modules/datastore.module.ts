import Datastore from 'nedb-promises';
import fs from 'fs';

import { IAppMain, IAppModule } from '../../interfaces';
import { AppEnums } from '../../enums';

const debug = require('debug')('app:module:datastore_module');

type DatastoreIndex = {
  field: string,
  unique?: boolean,
};

type DatastoreOptions = {
  indexes?: DatastoreIndex[]
};

export class DatastoreModule implements IAppModule {
  private readonly app: IAppMain;
  private readonly datastores: Record<string, Datastore> = {};
  private readonly datastoreDataPath = 'db';

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
    this.app.registerSyncMessageHandler(AppEnums.IPCCommChannels.DSRegisterDatastore, this.registerDatastore, this);
    this.app.registerAsyncMessageHandler(AppEnums.IPCCommChannels.DSFind, this.find, this);
    this.app.registerAsyncMessageHandler(AppEnums.IPCCommChannels.DSFindOne, this.findOne, this);
    this.app.registerAsyncMessageHandler(AppEnums.IPCCommChannels.DSInsertOne, this.insertOne, this);
    this.app.registerAsyncMessageHandler(AppEnums.IPCCommChannels.DSUpdateOne, this.updateOne, this);
    this.app.registerAsyncMessageHandler(AppEnums.IPCCommChannels.DSRemove, this.remove, this);
    this.app.registerAsyncMessageHandler(AppEnums.IPCCommChannels.DSRemoveOne, this.removeOne, this);
  }

  private removeDatastore(datastore: Datastore): void {
    const datastoreFilename = this.getDatastoreFilename(datastore);
    debug('removeDatastore - attempting to remove datastore file - %s', datastoreFilename);

    try {
      fs.unlinkSync(datastoreFilename);
      debug('removeDatastore - datastore file was removed successfully');
    } catch (error) {
      if (error.code === 'ENOENT') {
        debug('removeDatastore - datastore file does not exists');
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
    const datastorePath = this.app.getDataPath(this.datastoreDataPath, datastoreName);
    const datastore = Datastore.create(datastorePath);

    // configure datastore
    datastore.on('error', (_datastore, event: string, error: Error) => {
      debug('datastore encountered error - %s, event - %s, error - %s', datastoreName, event, error.message);
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

  private find(datastoreName: string, datastoreFindDoc: object): Promise<any> {
    const datastore = this.getDatastore(datastoreName);
    return datastore.find(datastoreFindDoc);
  }

  private findOne(datastoreName: string, datastoreFindOneDoc: object): Promise<any> {
    const datastore = this.getDatastore(datastoreName);
    return datastore.findOne(datastoreFindOneDoc);
  }

  private insertOne(datastoreName: string, datastoreInsertDoc: object): Promise<any> {
    const datastore = this.getDatastore(datastoreName);
    return datastore.insert(datastoreInsertDoc);
  }

  private async updateOne(datastoreName: string, datastoreFindOneDoc: object, datastoreUpdateOneDoc: object): Promise<void> {
    const datastore = this.getDatastore(datastoreName);

    return datastore.update(datastoreFindOneDoc, datastoreUpdateOneDoc, {
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
}

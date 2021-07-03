import Datastore from 'nedb-promises';
import fs from 'fs';

import {IAppMain, IAppModule} from '../../interfaces';
import {AppEnums} from '../../enums';

const debug = require('debug')('app:module:datastore_module');

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

  private registerMessageHandlers(): void {
    this.app.registerSyncMessageHandler(AppEnums.IPCCommChannels.DSRegisterDatastore, this.registerDatastore, this);
    this.app.registerAsyncMessageHandler(AppEnums.IPCCommChannels.DSFind, this.find, this);
    this.app.registerAsyncMessageHandler(AppEnums.IPCCommChannels.DSFindOne, this.findOne, this);
    this.app.registerAsyncMessageHandler(AppEnums.IPCCommChannels.DSInsertOne, this.insertOne, this);
    this.app.registerAsyncMessageHandler(AppEnums.IPCCommChannels.DSUpdateOne, this.updateOne, this);
  }

  private removeDatastore(datastore: Datastore) {
    // for some reason, filename is not declared in types by NeDb
    // @ts-ignore
    const datastoreFileName = datastore.persistence.filename;
    debug('removeDatastore - attempting to remove datastore file - %s', datastoreFileName);

    try {
      fs.unlinkSync(datastoreFileName);
      debug('removeDatastore - datastore file was removed successfully');
    } catch (error) {
      if (error.code === 'ENOENT') {
        debug('removeDatastore - datastore file does not exists');
      } else {
        throw error;
      }
    }
  }

  private registerDatastore(datastoreName: string): void {
    // obtain datastore path and create datastore
    const datastorePath = this.app.getDataPath(this.datastoreDataPath, datastoreName);
    const datastore = Datastore.create(datastorePath);

    // configure datastore
    datastore.on('error', (_datastore, event: string, error: Error) => {
      debug('datastore encountered error - %s, event - %s, error - %s', datastoreName, event, error.message);
    });

    this.datastores[datastoreName] = datastore;
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

  private updateOne(datastoreName: string, datastoreFindOneDoc: object, datastoreUpdateOneDoc: object): Promise<any> {
    const datastore = this.getDatastore(datastoreName);
    return datastore.update(datastoreFindOneDoc, datastoreUpdateOneDoc, {
      multi: false,
      upsert: false,
      returnUpdatedDocs: false,
    });
  }

  private getDatastore(datastoreName: string): Datastore {
    const datastore = this.datastores[datastoreName];
    if (!datastore) {
      throw new Error(`DatastoreModule encountered error at getDatastore - Could not find datastore for - ${datastoreName}`);
    }
    return datastore;
  }
}

import {
  DataStoreFilterData,
  DataStoreInputData,
  DataStoreQueryData,
  DataStoreUpdateData,
} from '../modules/datastore';

import { IPCRenderer, IPCCommChannel } from '../modules/ipc';

export abstract class BaseDatastore<T> {
  protected readonly datastoreName: string;

  protected constructor(datastoreName: string, indexes?: { field: keyof T & string; unique?: boolean }[]) {
    this.datastoreName = datastoreName;

    IPCRenderer.sendSyncMessage(IPCCommChannel.DSRegisterDatastore, this.datastoreName, {
      indexes,
    });
  }

  count(): Promise<number> {
    return IPCRenderer.sendAsyncMessage(IPCCommChannel.DSCount, this.datastoreName);
  }

  // single

  findOne(filterData: DataStoreFilterData<T>): Promise<T | undefined> {
    return IPCRenderer.sendAsyncMessage(IPCCommChannel.DSFindOne, this.datastoreName, filterData);
  }

  insertOne(inputData: DataStoreInputData<T>): Promise<T> {
    return IPCRenderer.sendAsyncMessage(IPCCommChannel.DSInsertOne, this.datastoreName, inputData);
  }

  updateOne(id: string, updateData: DataStoreUpdateData<T>): Promise<T> {
    return IPCRenderer.sendAsyncMessage(IPCCommChannel.DSUpdateOne, this.datastoreName, {
      id,
    }, {
      $set: updateData,
    });
  }

  removeOne(filterData: DataStoreFilterData<T>): Promise<void> {
    return IPCRenderer.sendAsyncMessage(IPCCommChannel.DSRemoveOne, this.datastoreName, filterData);
  }

  // multi

  find(filterData?: DataStoreFilterData<T>, filterOptions?: Omit<DataStoreQueryData<T>, 'filter'>): Promise<T[]> {
    return IPCRenderer.sendAsyncMessage(IPCCommChannel.DSFind, this.datastoreName, {
      filter: filterData,
      ...(filterOptions || {}),
    });
  }

  remove(filterData: DataStoreFilterData<T>): Promise<void> {
    return IPCRenderer.sendAsyncMessage(IPCCommChannel.DSRemove, this.datastoreName, filterData);
  }
}

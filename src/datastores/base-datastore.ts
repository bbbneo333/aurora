import {
  DataStoreFilterData,
  DataStoreInputData,
  DataStoreQueryData,
  DataStoreUpdateData,
} from '../types';

import { IPCService, IPCCommChannel } from '../modules/ipc';

export abstract class BaseDatastore<T> {
  protected readonly datastoreName: string;

  protected constructor(datastoreName: string, indexes?: { field: keyof T & string; unique?: boolean }[]) {
    this.datastoreName = datastoreName;

    IPCService.sendSyncMessage(IPCCommChannel.DSRegisterDatastore, this.datastoreName, {
      indexes,
    });
  }

  count(): Promise<number> {
    return IPCService.sendAsyncMessage(IPCCommChannel.DSCount, this.datastoreName);
  }

  // single

  findOne(filterData: DataStoreFilterData<T>): Promise<T | undefined> {
    return IPCService.sendAsyncMessage(IPCCommChannel.DSFindOne, this.datastoreName, filterData);
  }

  insertOne(inputData: DataStoreInputData<T>): Promise<T> {
    return IPCService.sendAsyncMessage(IPCCommChannel.DSInsertOne, this.datastoreName, inputData);
  }

  updateOne(id: string, updateData: DataStoreUpdateData<T>): Promise<T> {
    return IPCService.sendAsyncMessage(IPCCommChannel.DSUpdateOne, this.datastoreName, {
      id,
    }, {
      $set: updateData,
    });
  }

  removeOne(filterData: DataStoreFilterData<T>): Promise<void> {
    return IPCService.sendAsyncMessage(IPCCommChannel.DSRemoveOne, this.datastoreName, filterData);
  }

  // multi

  find(filterData?: DataStoreFilterData<T>, filterOptions?: Omit<DataStoreQueryData<T>, 'filter'>): Promise<T[]> {
    return IPCService.sendAsyncMessage(IPCCommChannel.DSFind, this.datastoreName, {
      filter: filterData,
      ...(filterOptions || {}),
    });
  }

  remove(filterData: DataStoreFilterData<T>): Promise<void> {
    return IPCService.sendAsyncMessage(IPCCommChannel.DSRemove, this.datastoreName, filterData);
  }
}

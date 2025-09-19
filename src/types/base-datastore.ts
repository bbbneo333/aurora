import { AppEnums, IPCCommChannels } from '../enums';
import { IPCService } from '../modules/ipc';

import {
  DataStoreFilterData,
  DataStoreInputData,
  DataStoreQueryData,
  DataStoreUpdateData,
} from './datastore.types';

export abstract class BaseDatastore<T> {
  protected readonly datastoreName: string;

  protected constructor(datastoreName: string, indexes?: { field: keyof T & string; unique?: boolean }[]) {
    this.datastoreName = datastoreName;

    IPCService.sendSyncMessage(IPCCommChannels.DSRegisterDatastore, this.datastoreName, {
      indexes,
    });
  }

  count(): Promise<number> {
    return IPCService.sendAsyncMessage(IPCCommChannels.DSCount, this.datastoreName);
  }

  // single

  findOne(filterData: DataStoreFilterData<T>): Promise<T | undefined> {
    return IPCService.sendAsyncMessage(IPCCommChannels.DSFindOne, this.datastoreName, filterData);
  }

  insertOne(inputData: DataStoreInputData<T>): Promise<T> {
    return IPCService.sendAsyncMessage(IPCCommChannels.DSInsertOne, this.datastoreName, inputData);
  }

  updateOne(id: string, updateData: DataStoreUpdateData<T>): Promise<T> {
    return IPCService.sendAsyncMessage(AppEnums.IPCCommChannels.DSUpdateOne, this.datastoreName, {
      id,
    }, {
      $set: updateData,
    });
  }

  removeOne(filterData: DataStoreFilterData<T>): Promise<void> {
    return IPCService.sendAsyncMessage(IPCCommChannels.DSRemoveOne, this.datastoreName, filterData);
  }

  // multi

  find(filterData?: DataStoreFilterData<T>, filterOptions?: Omit<DataStoreQueryData<T>, 'filter'>): Promise<T[]> {
    return IPCService.sendAsyncMessage(IPCCommChannels.DSFind, this.datastoreName, {
      filter: filterData,
      ...(filterOptions || {}),
    });
  }

  remove(filterData: DataStoreFilterData<T>): Promise<void> {
    return IPCService.sendAsyncMessage(IPCCommChannels.DSRemove, this.datastoreName, filterData);
  }
}

import { AppEnums, IPCCommChannels } from '../enums';
import AppService from '../services/app.service';

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

    AppService.sendSyncMessage(IPCCommChannels.DSRegisterDatastore, this.datastoreName, {
      indexes,
    });
  }

  count(): Promise<number> {
    return AppService.sendAsyncMessage(IPCCommChannels.DSCount, this.datastoreName);
  }

  // single

  findOne(filterData: DataStoreFilterData<T>): Promise<T | undefined> {
    return AppService.sendAsyncMessage(IPCCommChannels.DSFindOne, this.datastoreName, filterData);
  }

  insertOne(inputData: DataStoreInputData<T>): Promise<T> {
    return AppService.sendAsyncMessage(IPCCommChannels.DSInsertOne, this.datastoreName, inputData);
  }

  updateOne(id: string, updateData: DataStoreUpdateData<T>): Promise<T> {
    return AppService.sendAsyncMessage(AppEnums.IPCCommChannels.DSUpdateOne, this.datastoreName, {
      id,
    }, {
      $set: updateData,
    });
  }

  removeOne(filterData: DataStoreFilterData<T>): Promise<void> {
    return AppService.sendAsyncMessage(IPCCommChannels.DSRemoveOne, this.datastoreName, filterData);
  }

  // multi

  find(filterData?: DataStoreFilterData<T>, filterOptions?: Omit<DataStoreQueryData<T>, 'filter'>): Promise<T[]> {
    return AppService.sendAsyncMessage(IPCCommChannels.DSFind, this.datastoreName, {
      filter: filterData,
      ...(filterOptions || {}),
    });
  }

  remove(filterData: DataStoreFilterData<T>): Promise<void> {
    return AppService.sendAsyncMessage(IPCCommChannels.DSRemove, this.datastoreName, filterData);
  }
}

import { IMediaAlbumData } from '../interfaces';

import {
  DataStoreFilterData,
  DataStoreInputData,
  DataStoreUpdateData,
  DatastoreUtils,
} from '../modules/datastore';

import { IPCRenderer, IPCCommChannel } from '../modules/ipc';

class MediaAlbumDatastore {
  private readonly mediaAlbumDatastoreName = 'media_albums';

  constructor() {
    IPCRenderer.sendSyncMessage(IPCCommChannel.DSRegisterDatastore, this.mediaAlbumDatastoreName, {
      indexes: [{
        field: 'id',
        unique: true,
      }, {
        field: 'provider_id',
        unique: true,
      }, {
        field: 'album_name',
      }],
    });
  }

  findMediaAlbumById(mediaAlbumId: string): Promise<IMediaAlbumData | undefined> {
    return IPCRenderer.sendAsyncMessage(IPCCommChannel.DSFindOne, this.mediaAlbumDatastoreName, {
      id: mediaAlbumId,
    });
  }

  findMediaAlbum(mediaAlbumFilterData: DataStoreFilterData<IMediaAlbumData>): Promise<IMediaAlbumData | undefined> {
    return IPCRenderer.sendAsyncMessage(IPCCommChannel.DSFindOne, this.mediaAlbumDatastoreName, mediaAlbumFilterData);
  }

  findMediaAlbums(mediaAlbumFilterData?: DataStoreFilterData<IMediaAlbumData>): Promise<IMediaAlbumData[]> {
    return IPCRenderer.sendAsyncMessage(IPCCommChannel.DSFind, this.mediaAlbumDatastoreName, {
      filter: mediaAlbumFilterData,
    });
  }

  updateAlbumById(mediaAlbumId: string, mediaAlbumUpdateData: DataStoreUpdateData<IMediaAlbumData>): Promise<IMediaAlbumData> {
    return IPCRenderer.sendAsyncMessage(IPCCommChannel.DSUpdateOne, this.mediaAlbumDatastoreName, {
      id: mediaAlbumId,
    }, {
      $set: mediaAlbumUpdateData,
    });
  }

  insertMediaAlbum(mediaAlbumInputData: DataStoreInputData<IMediaAlbumData>): Promise<IMediaAlbumData> {
    return IPCRenderer.sendAsyncMessage(IPCCommChannel.DSInsertOne, this.mediaAlbumDatastoreName, mediaAlbumInputData);
  }

  deleteAlbums(mediaAlbumFilterData?: DataStoreFilterData<IMediaAlbumData>): Promise<void> {
    return IPCRenderer.sendAsyncMessage(IPCCommChannel.DSRemove, this.mediaAlbumDatastoreName, mediaAlbumFilterData);
  }

  upsertMediaAlbum(input: DataStoreInputData<IMediaAlbumData>): Promise<IMediaAlbumData> {
    const id = DatastoreUtils.composeId(input.provider, input.provider_id);

    return IPCRenderer.sendAsyncMessage(IPCCommChannel.DSUpsertOne, this.mediaAlbumDatastoreName, {
      id,
    }, {
      $set: {
        ...input,
        id,
      },
    });
  }
}

export default new MediaAlbumDatastore();

import { BaseDatastore } from '../types/base-datastore';
import { IMediaPinnedItemData } from '../interfaces';

class MediaPinnedItemDatastore extends BaseDatastore<IMediaPinnedItemData> {
  constructor() {
    super('media_pinned_items', [
      { field: 'id', unique: true },
      { field: 'collection_item_id' },
    ]);
  }
}

export default new MediaPinnedItemDatastore();

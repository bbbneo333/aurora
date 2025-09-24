import { IMediaPinnedItemData } from '../interfaces';

import { BaseDatastore } from './base-datastore';

class MediaPinnedItemDatastore extends BaseDatastore<IMediaPinnedItemData> {
  constructor() {
    super('media_pinned_items', [
      { field: 'id', unique: true },
      { field: 'collection_item_id' },
    ]);
  }
}

export default new MediaPinnedItemDatastore();

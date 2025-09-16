import { isEmpty } from 'lodash';

import { MediaPinnedItemDatastore } from '../datastores';
import { MediaLibraryActions } from '../enums';
import { IMediaCollectionItem, IMediaPinnedItem, IMediaPinnedItemData } from '../interfaces';
import store from '../store';

import MediaCollectionService from './media-collection.service';

class MediaPinnedItemService {
  loadPinnedItems() {
    this.getPinnedItems()
      .then((mediaPinnedItems) => {
        store.dispatch({
          type: MediaLibraryActions.SetPinnedItems,
          data: {
            mediaPinnedItems,
          },
        });
      });
  }

  loadPinnedItemStatus(collectionItem: IMediaCollectionItem) {
    this.getPinnedItem(collectionItem)
      .then((pinnedItem) => {
        if (pinnedItem) {
          store.dispatch({
            type: MediaLibraryActions.AddPinnedItem,
            data: {
              mediaPinnedItem: pinnedItem,
            },
          });
        } else {
          store.dispatch({
            type: MediaLibraryActions.RemovePinnedCollectionItem,
            data: {
              mediaCollectionItem: collectionItem,
            },
          });
        }
      });
  }

  async getPinnedItems(): Promise<IMediaPinnedItem[]> {
    const dataList = await MediaPinnedItemDatastore.find();

    return Promise.map(dataList, data => this.buildPinnedItem(data));
  }

  async getPinnedItem(collectionItem: IMediaCollectionItem): Promise<IMediaPinnedItem | undefined> {
    const data = await MediaPinnedItemDatastore.findOne({
      collection_item_id: collectionItem.id,
      collection_item_type: collectionItem.type,
    });

    return data ? this.buildPinnedItem(data) : undefined;
  }

  async pinCollectionItem(collectionItem: IMediaCollectionItem): Promise<IMediaPinnedItem> {
    const newOrder = await this.getOrderForNewItem();

    const data = await MediaPinnedItemDatastore.insertOne({
      collection_item_id: collectionItem.id,
      collection_item_type: collectionItem.type,
      order: newOrder,
      pinned_at: Date.now(),
    });

    const pinnedItem = await this.buildPinnedItem(data);

    store.dispatch({
      type: MediaLibraryActions.AddPinnedItem,
      data: {
        mediaPinnedItem: pinnedItem,
      },
    });

    return pinnedItem;
  }

  async unpinCollectionItem(collectionItem: IMediaCollectionItem): Promise<void> {
    await MediaPinnedItemDatastore.remove({
      collection_item_id: collectionItem.id,
      collection_item_type: collectionItem.type,
    });

    store.dispatch({
      type: MediaLibraryActions.RemovePinnedCollectionItem,
      data: {
        mediaCollectionItem: collectionItem,
      },
    });
  }

  private async getOrderForNewItem(): Promise<number> {
    // get the last pinned item for obtaining order
    // we start with 0 if not found (index based)
    const data = await MediaPinnedItemDatastore.find({}, {
      limit: 1,
      sort: { order: -1 },
    });
    if (isEmpty(data)) {
      return 0;
    }

    const itemData = data[0];
    return itemData.order + 1;
  }

  private async buildPinnedItem(data: IMediaPinnedItemData): Promise<IMediaPinnedItem> {
    const collectionItem = await MediaCollectionService.getMediaItem(
      data.collection_item_id,
      data.collection_item_type,
    );
    if (!collectionItem) {
      throw new Error(`Encountered error at buildPinnedItem - Could not find collection item, id - ${data.collection_item_id}, type - ${data.collection_item_type}`);
    }

    return {
      ...data,
      ...collectionItem,
    };
  }
}

export default new MediaPinnedItemService();

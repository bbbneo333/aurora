import { isEmpty, omit } from 'lodash';

import { MediaPinnedItemDatastore } from '../datastores';
import { MediaLibraryActions } from '../enums';
import { IMediaPinnedItem, IMediaPinnedItemData, IMediaPinnedItemInputData } from '../interfaces';
import { EntityNotFoundError } from '../types';
import store from '../store';

import { MediaCollectionService } from './media-collection.service';

export class MediaPinnedItemService {
  static readonly removeOnMissing = false;

  static loadPinnedItems() {
    this.resolvePinnedItems()
      .then((mediaPinnedItems) => {
        store.dispatch({
          type: MediaLibraryActions.SetPinnedItems,
          data: {
            mediaPinnedItems,
          },
        });
      });
  }

  static loadPinnedItemStatus(input: IMediaPinnedItemInputData) {
    this.getPinnedItem(input)
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
            type: MediaLibraryActions.RemovePinnedItem,
            data: {
              mediaPinnedItemInput: input,
            },
          });
        }
      });
  }

  static async resolvePinnedItems(): Promise<IMediaPinnedItem[]> {
    // this function fetches pinned items along with their collection item
    // in case collection item entry is not found, it removes the pinned item (if enabled)
    const dataList = await MediaPinnedItemDatastore.find();
    const items: IMediaPinnedItem[] = [];

    await Promise.map(dataList, async (data: IMediaPinnedItemData) => {
      try {
        const item = await this.buildPinnedItem(data);
        items.push(item);
      } catch (error) {
        if (error instanceof EntityNotFoundError) {
          console.warn(error);

          if (this.removeOnMissing) {
            await this.unpinCollectionItem({
              id: data.collection_item_id,
              type: data.collection_item_type,
            });
          }
        }
      }
    });

    return items;
  }

  static async getPinnedItem(input: IMediaPinnedItemInputData): Promise<IMediaPinnedItem | undefined> {
    try {
      const data = await MediaPinnedItemDatastore.findOne({
        collection_item_id: input.id,
        collection_item_type: input.type,
      });

      return data ? await this.buildPinnedItem(data) : undefined;
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        console.warn(error);
        return undefined;
      }

      throw error;
    }
  }

  static async pinCollectionItem(input: IMediaPinnedItemInputData): Promise<IMediaPinnedItem> {
    const newOrder = await this.getOrderForNewItem();

    const data = await MediaPinnedItemDatastore.insertOne({
      collection_item_id: input.id,
      collection_item_type: input.type,
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

  static async unpinCollectionItem(input: IMediaPinnedItemInputData): Promise<void> {
    await MediaPinnedItemDatastore.remove({
      collection_item_id: input.id,
      collection_item_type: input.type,
    });

    store.dispatch({
      type: MediaLibraryActions.RemovePinnedItem,
      data: {
        mediaPinnedItemInput: input,
      },
    });
  }

  static async updatePinnedItemsOrder(itemIds: string[]): Promise<void> {
    // update order - itemIds need to be in the required order
    await Promise.map(itemIds, async (itemId, index) => MediaPinnedItemDatastore.updateOne(itemId, {
      order: index,
    }));

    this.loadPinnedItems();
  }

  private static async getOrderForNewItem(): Promise<number> {
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

  private static async buildPinnedItem(pinnedItemData: IMediaPinnedItemData): Promise<IMediaPinnedItem> {
    const collectionItem = await MediaCollectionService.getMediaItem(
      pinnedItemData.collection_item_id,
      pinnedItemData.collection_item_type,
    );
    if (!collectionItem) {
      throw new EntityNotFoundError(pinnedItemData.collection_item_id, pinnedItemData.collection_item_type);
    }

    return {
      ...collectionItem,
      ...omit(pinnedItemData, 'id'),
      pinned_item_id: pinnedItemData.id,
    };
  }
}

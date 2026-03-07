import React, { useMemo } from 'react';
import { isEmpty } from 'lodash';

import { IMediaCollectionItem } from '../../interfaces';
import { MediaCollectionService } from '../../services';
import { StringUtils } from '../../utils';

import { Grid } from '../grid/grid.component';
import { MediaCollectionTile } from '../media-collection-tile/media-collection-tile.component';
import { MediaCollectionContextMenu, MediaCollectionContextMenuItem } from '../media-collection-context-menu/media-collection-context-menu.component';

export type MediaCollectionGridProps = {
  items: IMediaCollectionItem[];
  contextMenuItems?: MediaCollectionContextMenuItem[];
};

export function MediaCollectionGrid(props: MediaCollectionGridProps) {
  const { items, contextMenuItems } = props;

  const contextMenuId = useMemo(
    () => (!isEmpty(contextMenuItems) ? StringUtils.generateId() : undefined),
    [
      contextMenuItems,
    ],
  );

  const renderTile = React.useCallback((item: IMediaCollectionItem) => (
    <MediaCollectionTile
      mediaItem={item}
      routerLink={MediaCollectionService.getItemRouterLink(item)}
      subtitle={MediaCollectionService.getItemSubtitle(item)}
      contextMenuId={contextMenuId}
      coverPlaceholderIcon={MediaCollectionService.getItemCoverPlaceholderIcon(item)}
    />
  ), [
    contextMenuId,
  ]);

  return (
    <>
      <Grid items={items}>
        {item => renderTile(item)}
      </Grid>
      {contextMenuId && contextMenuItems && (
        <MediaCollectionContextMenu
          id={contextMenuId}
          menuItems={contextMenuItems}
        />
      )}
    </>
  );
}

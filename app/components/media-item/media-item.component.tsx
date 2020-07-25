import React, {useContext} from 'react';

import {IMediaItem} from '../../interfaces';
import {AppContext, MediaLibraryContext} from '../../contexts';
import {MediaEnums} from '../../enums';

export function MediaItemComponent(props: { mediaItem: IMediaItem }) {
  const appContext = useContext(AppContext);
  const mediaContext = useContext(MediaLibraryContext);
  if (!appContext) {
    throw new Error('MediaItemComponent encountered error - Missing context - AppContext');
  }
  if (!mediaContext) {
    throw new Error('MediaItemComponent encountered error - Missing context - MediaLibraryContext');
  }
  const {mediaItem} = props;
  const {i18nService} = appContext;
  const {mediaItemManager} = mediaContext;

  return (
    <li>
      {mediaItem.track_name}
      <button
        type="submit"
        onClick={() => mediaItemManager({
          type: MediaEnums.MediaLibraryActions.REMOVE_TRACK,
          data: mediaItem.id,
        })}
      >
        {i18nService.getString('action_remove_track')}
      </button>
    </li>
  );
}

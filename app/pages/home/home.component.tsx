import React, {useContext} from 'react';

import './home.component.css';

import {CollectionService, I18nService} from '../../services';
import {MediaLibraryContext} from '../../contexts';
import {IMediaItem} from "../../interfaces";
import {MediaEnums} from '../../enums';

export function HomeComponent(props: {
  i18nService: I18nService;
  collectionService: CollectionService;
}) {
  // obtain context
  const mediaContext = useContext(MediaLibraryContext);
  // verify context
  if (!mediaContext) {
    throw new Error('HomeComponent encountered error - Missing context - MediaLibraryContext');
  }
  // break down context
  const {mediaItems, mediaLibraryManage} = mediaContext;
  const {i18nService} = props;

  return (
    <div>
      <ul style={{paddingLeft: 10, width: '95%'}}>
        {mediaItems.map((mediaItem: IMediaItem) => (
          <li key={mediaItem.id}>{mediaItem.track_name}</li>
        ))}
      </ul>
      <button type="submit" onClick={() => mediaLibraryManage({
        type: MediaEnums.MediaLibraryActions.ADD_TRACKS,
      })}>
        {i18nService.getString('action_add_tracks')}
      </button>
    </div>
  );
}

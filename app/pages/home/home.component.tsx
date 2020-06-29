import React, {useContext} from 'react';

import './home.component.css';

import {CollectionService, I18nService} from '../../services';
import {MediaLibraryContext} from '../../contexts';
import {IMediaItem} from "../../interfaces";

export function HomeComponent(props: {
  i18nService: I18nService;
  collectionService: CollectionService;
}) {
  const mediaItems: IMediaItem[] = useContext(MediaLibraryContext);
  const {i18nService, collectionService} = props;

  return (
    <div>
      <ul style={{paddingLeft: 10, width: '95%'}}>
        {mediaItems.map(mediaItem => (
          <li key={mediaItem.id}>{mediaItem.track_name}</li>
        ))}
      </ul>
      <button type="submit" onClick={() => collectionService.addTracks()}>
        {i18nService.getString('actions_add_tracks')}
      </button>
    </div>
  );
}

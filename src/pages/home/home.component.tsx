import React from 'react';
import {useSelector} from 'react-redux';

import {MediaTrackComponent} from '../../components';
import {RootState} from '../../reducers';

export function HomeComponent() {
  const mediaLibrary = useSelector((state: RootState) => state.mediaLibrary);

  return (
    <div>
      <ul>
        {mediaLibrary.mediaTracks.map(mediaTrack => (
          <MediaTrackComponent
            key={mediaTrack.id}
            mediaTrack={mediaTrack}
          />
        ))}
      </ul>
    </div>
  );
}

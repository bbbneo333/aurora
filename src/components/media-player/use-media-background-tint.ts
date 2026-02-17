import React from 'react';
import { useSelector } from 'react-redux';

import { MediaTrackCoverPictureImageDataType } from '../../enums';
import { RootState } from '../../reducers';

import { IPCCommChannel, IPCRenderer } from '../../modules/ipc';

export const useMediaBackgroundTint = () => {
  const mediaPlaybackCurrentMediaTrack = useSelector((state: RootState) => state.mediaPlayer.mediaPlaybackCurrentMediaTrack);
  const [isTinted, setIsTinted] = React.useState(false);
  const [tintColors, setTintColors] = React.useState<string[]>([]);

  const reset = () => {
    setIsTinted(false);
    setTintColors([]);
  };

  const change = (colors: string[]) => {
    setIsTinted(true);
    setTintColors(colors);
  };

  React.useEffect(() => {
    // we determine tint based on track's album art
    const picture = mediaPlaybackCurrentMediaTrack?.track_cover_picture || mediaPlaybackCurrentMediaTrack?.track_album.album_cover_picture;
    const pictureIsValid = !!picture && picture.image_data_type === MediaTrackCoverPictureImageDataType.Path;

    if (!pictureIsValid) {
      reset();
      return;
    }

    const imagePath = picture.image_data as string;

    IPCRenderer.sendAsyncMessage(IPCCommChannel.ImageGetColors, imagePath)
      .then((colors: string[]) => {
        if (colors.length !== 3) {
          console.error('ImageGetColors returned invalid response for image - %s', imagePath, colors);
          reset();
        } else {
          change(colors);
        }
      })
      .catch((error) => {
        console.error('Encountered error on ImageGetColors for image - %s', imagePath);
        console.error(error);

        // reset on failure
        reset();
      });
  }, [
    mediaPlaybackCurrentMediaTrack,
  ]);

  return {
    isTinted,
    tintColors,
  };
};

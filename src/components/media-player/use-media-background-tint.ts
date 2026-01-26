import React from 'react';
import { useSelector } from 'react-redux';

import { MediaTrackCoverPictureImageDataType } from '../../enums';
import { RootState } from '../../reducers';
import { VibrantService } from '../../modules/vibrant';

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
    const picture = mediaPlaybackCurrentMediaTrack?.track_album.album_cover_picture;
    const pictureIsValid = !!picture && picture.image_data_type === MediaTrackCoverPictureImageDataType.Path;

    if (!pictureIsValid) {
      reset();
      return;
    }

    const picturePath = picture.image_data as string;

    VibrantService.getColors(picturePath)
      .then((colors) => {
        if (colors.length !== 3) {
          console.error('VibrantService.getColors returned invalid response', colors);
          reset();
        } else {
          change(colors);
        }
      })
      .catch((error) => {
        console.error('Encountered error on VibrantService.getColors');
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

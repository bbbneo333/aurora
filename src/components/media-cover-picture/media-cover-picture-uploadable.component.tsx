import React, { useCallback } from 'react';

import { AppEnums, MediaEnums, ImageFileExtensionList } from '../../enums';
import { IMediaPicture } from '../../interfaces';
import { AppService, MediaLibraryService } from '../../services';

import { UploadOverlay } from '../upload/upload-overlay.component';
import { MediaCoverPicture, MediaCoverPictureProps } from './media-cover-picture.component';

export type MediaCoverPictureUploadableProps = {
  onPictureUpdate?: (picture: IMediaPicture) => void;
} & MediaCoverPictureProps;

export function MediaCoverPictureUploadable(props: MediaCoverPictureUploadableProps) {
  const {
    onPictureUpdate,
    ...rest
  } = props;

  const handleUpload = useCallback(async (filePath?: string) => {
    if (!filePath || !onPictureUpdate) {
      return;
    }

    const imagePath = await AppService.sendAsyncMessage(AppEnums.IPCCommChannels.MediaScaleAndCacheImage, filePath, {
      width: MediaLibraryService.mediaPictureScaleWidth,
      height: MediaLibraryService.mediaPictureScaleHeight,
    });

    onPictureUpdate({
      image_data: imagePath,
      image_data_type: MediaEnums.MediaTrackCoverPictureImageDataType.Path,
    });
  }, [
    onPictureUpdate,
  ]);

  return (
    <UploadOverlay
      onUpload={handleUpload}
      extensions={ImageFileExtensionList}
    >
      <MediaCoverPicture {...rest}/>
    </UploadOverlay>
  );
}

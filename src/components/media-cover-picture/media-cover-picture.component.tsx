import React from 'react';
import classNames from 'classnames/bind';

import {MediaEnums} from '../../enums';
import {IMediaPicture} from '../../interfaces';

import styles from './media-cover-picture.component.css';

const cx = classNames.bind(styles);

export function MediaCoverPictureComponent(props: {
  mediaPicture?: IMediaPicture,
  mediaPictureAltText: string,
  className?: string,
}) {
  const {
    mediaPicture,
    mediaPictureAltText,
    className,
  } = props;

  if (!mediaPicture) {
    return (
      <div className={cx('media-cover-picture', className)}>
        <div className={cx('media-cover-placeholder')}>
          <i className={cx('media-cover-placeholder-icon', 'fas fa-compact-disc')}/>
        </div>
      </div>
    );
  }

  // determine image source for the cover image based on the cover picture and image data type provided
  let mediaCoverPictureImageSrc;

  switch (mediaPicture.image_data_type) {
    case MediaEnums.MediaTrackCoverPictureImageDataType.Path: {
      mediaCoverPictureImageSrc = mediaPicture.image_data;
      break;
    }
    default:
      throw new Error(`MediaTrackCoverPictureComponent component encountered error while process media track - Unsupported image data type - ${mediaPicture.image_data_type}`);
  }

  return (
    <div className={cx('media-cover-picture', className)}>
      <img
        alt={mediaPictureAltText}
        src={mediaCoverPictureImageSrc}
      />
    </div>
  );
}

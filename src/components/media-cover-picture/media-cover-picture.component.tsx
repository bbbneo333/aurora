import React from 'react';
import classNames from 'classnames/bind';

import {Icons} from '../../constants';
import {MediaEnums} from '../../enums';
import {IMediaPicture} from '../../interfaces';

import {Icon} from '../icon/icon.component';

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
          <Icon
            className={cx('media-cover-placeholder-icon')}
            name={Icons.CoverAlbumPlaceholder}
          />
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

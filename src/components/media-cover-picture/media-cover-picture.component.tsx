import React from 'react';
import classNames from 'classnames/bind';
import * as _ from 'lodash';

import {MediaEnums} from '../../enums';
import {IMediaPicture} from '../../interfaces';

import styles from './media-cover-picture.component.css';

const cx = classNames.bind(styles);

export function MediaCoverPictureComponent(props: {
  mediaPicture: IMediaPicture,
  mediaPictureAltText: string,
  className?: string,
}) {
  const {
    mediaPicture,
    mediaPictureAltText,
    className,
  } = props;

  // determine image source for the cover image based on the cover picture and image data type provided
  let mediaCoverPictureImageSrc;

  switch (mediaPicture.image_data_type) {
    case MediaEnums.MediaTrackCoverPictureImageDataType.Buffer: {
      // TODO: Fix issue with serialization when storing Buffer data with NeDb
      //  Our persistence layer does not supports Buffer natively, because of this we receive data in invalid format
      //  This is a temporary hack to covert the serialized data ({0: int, 1: int, ...}) to Buffer
      const mediaPictureRawBuffer = _.map(mediaPicture.image_data, bufferPoint => bufferPoint);
      const mediaPictureBuffer = Buffer.from(mediaPictureRawBuffer);

      mediaCoverPictureImageSrc = `data:${mediaPicture.image_format};base64,${mediaPictureBuffer.toString('base64')}`;
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

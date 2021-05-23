import React from 'react';
import classNames from 'classnames/bind';

import {MediaEnums} from '../../enums';
import {MediaTrack} from '../../models';

import styles from './media-track-cover-picture.component.css';

const cx = classNames.bind(styles);

export function MediaTrackCoverPictureComponent(props: {
  mediaTrack: MediaTrack,
}) {
  const {mediaTrack} = props;

  // determine image source for the cover image based on the cover picture and image data type provided
  let mediaTrackCoverPictureImageSrc;

  if (mediaTrack.track_cover_picture) {
    const mediaTrackCoverPicture = mediaTrack.track_cover_picture;

    switch (mediaTrackCoverPicture.image_data_type) {
      case MediaEnums.MediaTrackCoverPictureImageDataType.Buffer: {
        mediaTrackCoverPictureImageSrc = `data:${mediaTrackCoverPicture.image_format};base64,${mediaTrackCoverPicture.image_data.toString('base64')}`;
        break;
      }
      default:
        throw new Error(`MediaTrackCoverPictureComponent component encountered error while process media track - Unsupported image data type - ${mediaTrackCoverPicture.image_data_type}`);
    }
  }

  return mediaTrackCoverPictureImageSrc
    ? (
      <div className={cx('media-track-cover-picture-container')}>
        <img
          alt={mediaTrack.track_album_name}
          src={mediaTrackCoverPictureImageSrc}
        />
      </div>
    )
    : (<div className={cx('media-track-cover-picture-no-content')}/>);
}

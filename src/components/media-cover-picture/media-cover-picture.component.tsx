import React from 'react';
import classNames from 'classnames/bind';

import { MediaEnums } from '../../enums';
import { IMediaPicture } from '../../interfaces';

import { Icon } from '../icon/icon.component';

import styles from './media-cover-picture.component.css';

const cx = classNames.bind(styles);

export type MediaCoverPictureProps = {
  children?: React.ReactNode;
  mediaPicture?: IMediaPicture;
  mediaPictureAltText?: string;
  mediaCoverPlaceholderIcon?: string;
  className?: string;
  contentClassName?: string;
  onContextMenu?: (e: React.MouseEvent) => void;
};

export function MediaCoverPicture(props: MediaCoverPictureProps) {
  const {
    children,
    mediaPicture,
    mediaPictureAltText,
    mediaCoverPlaceholderIcon,
    className,
    contentClassName,
    onContextMenu,
  } = props;

  // determine image source for the cover image based on the cover picture and image data type provided
  let mediaCoverPictureImageSrc;

  if (mediaPicture) {
    switch (mediaPicture.image_data_type) {
      case MediaEnums.MediaTrackCoverPictureImageDataType.Path: {
        mediaCoverPictureImageSrc = mediaPicture.image_data;
        break;
      }
      default:
        throw new Error(`MediaTrackCoverPictureComponent component encountered error while process media track - Unsupported image data type - ${mediaPicture.image_data_type}`);
    }
  }

  return (
    <div
      className={cx('media-cover-picture', { has_content: !!children }, className)}
      onContextMenu={onContextMenu}
    >
      {mediaCoverPictureImageSrc ? (
        <img
          alt={mediaPictureAltText}
          src={mediaCoverPictureImageSrc}
        />
      ) : (
        mediaCoverPlaceholderIcon && (
          <div className={cx('media-cover-placeholder')}>
            <Icon
              className={cx('media-cover-placeholder-icon')}
              name={mediaCoverPlaceholderIcon}
            />
          </div>
        )
      )}
      <div className={cx('media-cover-picture-content', contentClassName)}>
        {children}
      </div>
    </div>
  );
}

import React, { HTMLAttributes, ReactNode } from 'react';
import classNames from 'classnames/bind';

import { Icons } from '../../constants';
import { I18nService } from '../../services';
import { Events } from '../../utils';
import { IPCRenderer, IPCCommChannel } from '../../modules/ipc';

import { LoaderIcon } from '../loader/loader-icon.component';
import { Icon } from '../icon/icon.component';

import styles from './upload-overlay.component.css';

const cx = classNames.bind(styles);

export type UploadOverlayProps = {
  onUpload: (filePath?: string, error?: Error) => Promise<void> | void;
  children?: ReactNode;
  disabled?: boolean;
  title?: string;
  icon?: string;
  extensions?: string[];
} & HTMLAttributes<HTMLDivElement>;

export function UploadOverlay(props: UploadOverlayProps) {
  const {
    children,
    disabled = false,
    title,
    icon,
    extensions,
    onUpload,
    ...rest
  } = props;

  const ref = React.useRef<HTMLDivElement>(null);
  const [isUploading, setIsUploading] = React.useState(false);

  const unfocus = () => {
    ref.current?.blur();
  };

  const openDialog = () => {
    const selection = IPCRenderer.sendSyncMessage(IPCCommChannel.FSSelectFile, {
      extensions,
    });
    if (!selection) {
      return;
    }

    setIsUploading(true);

    Promise.resolve(onUpload(selection))
      .catch((error) => {
        console.error('onUpload failed: ', error);
      })
      .finally(() => {
        unfocus();
        setIsUploading(false);
      });
  };

  return (
    <div
      {...rest}
      ref={ref}
      role="button"
      tabIndex={0}
      className={cx(rest.className, 'upload-overlay', { disabled, uploading: isUploading })}
      onClick={(e) => {
        openDialog();
        rest.onClick?.(e);
      }}
      onKeyDown={(e) => {
        if (Events.isEnterKey(e)) openDialog();
        rest.onKeyDown?.(e);
      }}
    >
      <div className={cx('upload-overlay-zone')}>
        {isUploading ? (
          <span className={cx('upload-icon')}>
            <LoaderIcon/>
          </span>
        ) : (
          <>
            <span className={cx('upload-icon')}>
              <Icon name={icon || Icons.Edit}/>
            </span>
            <span className={cx('upload-title')}>
              {title || I18nService.getString('label_file_upload')}
            </span>
          </>
        )}
      </div>
      <div className={cx('upload-overlay-content')}>
        {children}
      </div>
    </div>
  );
}

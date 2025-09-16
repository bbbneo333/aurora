import React from 'react';
import { Modal } from 'react-bootstrap';

import { ModalComponent } from '../../contexts';
import { useDataAction, useDataLoad } from '../../hooks';
import { I18nService, MediaPlaylistService } from '../../services';

import { Button } from '../button/button.component';

export const MediaPlaylistDeleteModal: ModalComponent<{
  mediaPlaylistId: string;
}, {
  deletedId: string
}> = (props) => {
  const {
    mediaPlaylistId,
    onComplete,
  } = props;

  const loadedPlaylist = useDataLoad(() => MediaPlaylistService.getMediaPlaylist(mediaPlaylistId));
  const deletePlaylist = useDataAction(async () => {
    await MediaPlaylistService.deleteMediaPlaylist(mediaPlaylistId);
    onComplete({ deletedId: mediaPlaylistId });
  });

  return (
    <>
      <Modal.Header>
        <Modal.Title>
          {I18nService.getString('label_playlist_delete')}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {I18nService.getString('label_playlist_delete_details', {
          playlistName: <b>{loadedPlaylist.data?.name || ''}</b>,
        })}
      </Modal.Body>
      <Modal.Footer>
        <Button
          disabled={deletePlaylist.loading}
          onButtonSubmit={() => {
            onComplete();
          }}
        >
          {I18nService.getString('button_dialog_cancel')}
        </Button>
        <Button
          className="primary"
          disabled={deletePlaylist.loading}
          onButtonSubmit={deletePlaylist.perform}
        >
          {I18nService.getString('button_dialog_confirm')}
        </Button>
      </Modal.Footer>
    </>
  );
};

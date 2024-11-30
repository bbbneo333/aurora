import React from 'react';
import { Modal } from 'react-bootstrap';

import { useModal } from '../../contexts';
import { useDataAction, useDataLoad } from '../../hooks';
import { I18nService, MediaLibraryService } from '../../services';

import { Button } from '../button/button.component';

export function MediaPlaylistDeleteModal(props: {
  mediaPlaylistId: string;
}) {
  const { mediaPlaylistId } = props;
  const { hideModal } = useModal();
  const loadedPlaylist = useDataLoad(() => MediaLibraryService.getMediaPlaylist(mediaPlaylistId));
  const deletePlaylist = useDataAction(async () => {
    await MediaLibraryService.deleteMediaPlaylist(mediaPlaylistId);
    hideModal();
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
          onButtonSubmit={hideModal}
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
}

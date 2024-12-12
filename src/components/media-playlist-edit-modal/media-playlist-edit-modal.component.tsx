import React from 'react';
import { Form, Modal } from 'react-bootstrap';

import { useModal } from '../../contexts';
import { useDataAction, useDataLoad } from '../../hooks';
import { IMediaPlaylistInputData } from '../../interfaces';
import { I18nService, MediaLibraryService } from '../../services';

import { Button } from '../button/button.component';

export function MediaPlaylistEditModal(props: {
  mediaPlaylistId: string;
}) {
  const { mediaPlaylistId } = props;
  const { hideModal } = useModal();
  const [inputData, setInputData] = React.useState<IMediaPlaylistInputData>({});
  const loadedPlaylist = useDataLoad(() => MediaLibraryService.getMediaPlaylist(mediaPlaylistId));
  const editPlaylist = useDataAction(async (event) => {
    event.preventDefault();
    await MediaLibraryService.updateMediaPlaylist(mediaPlaylistId, inputData);
    loadedPlaylist.refresh();
    hideModal();
  });

  return (
    <>
      <Modal.Header>
        <Modal.Title>
          {I18nService.getString('label_playlist_edit')}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={editPlaylist.perform}>
          <Form.Group>
            <Form.Label>
              {I18nService.getString('label_playlist_name')}
            </Form.Label>
            <Form.Control
              required
              type="text"
              placeholder={loadedPlaylist.data?.name || ''}
              defaultValue={loadedPlaylist.data?.name || ''}
              onChange={event => setInputData({
                name: event.target.value,
              })}
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button
          disabled={editPlaylist.loading}
          onButtonSubmit={hideModal}
        >
          {I18nService.getString('button_dialog_cancel')}
        </Button>
        <Button
          className="primary"
          disabled={editPlaylist.loading}
          onButtonSubmit={editPlaylist.perform}
        >
          {I18nService.getString('button_dialog_confirm')}
        </Button>
      </Modal.Footer>
    </>
  );
}

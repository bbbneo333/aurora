import React, {
  useCallback, useEffect, useRef, useState,
} from 'react';
import { Form, Modal } from 'react-bootstrap';

import { useModal } from '../../contexts';
import { IMediaPlaylist, IMediaPlaylistUpdateData } from '../../interfaces';
import { I18nService, MediaLibraryService } from '../../services';
import { WithModalBaseProps } from '../../types';

import { Button } from '../button/button.component';

export function MediaPlaylistEditModal(props: WithModalBaseProps<{
  mediaPlaylistId: string;
}, {
  updatedPlaylist: IMediaPlaylist,
}>) {
  const { mediaPlaylistId, onComplete } = props;
  const { hideModal } = useModal();
  const [validated, setValidated] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [inputData, setInputData] = useState<IMediaPlaylistUpdateData>({
    name: '',
  });

  const handleSubmit = useCallback(async (event) => {
    event.preventDefault();
    setValidated(true);

    if (formRef.current?.checkValidity()) {
      const updatedPlaylist = await MediaLibraryService.updateMediaPlaylist(mediaPlaylistId, {
        name: inputData.name,
      });
      hideModal();
      onComplete?.({ updatedPlaylist });
    }
  }, [
    hideModal,
    inputData.name,
    mediaPlaylistId,
    onComplete,
  ]);

  useEffect(() => {
    MediaLibraryService.getMediaPlaylist(mediaPlaylistId)
      .then((mediaPlaylist) => {
        setInputData({
          ...mediaPlaylist,
        });
      });
  }, [
    mediaPlaylistId,
  ]);

  return (
    <>
      <Modal.Header>
        <Modal.Title>
          {I18nService.getString('label_playlist_edit')}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form ref={formRef} noValidate validated={validated} onSubmit={handleSubmit}>
          <Form.Group>
            <Form.Label>
              {I18nService.getString('label_playlist_name')}
            </Form.Label>
            <Form.Control
              required
              type="text"
              value={inputData.name}
              onChange={event => setInputData(data => ({
                ...data,
                name: event.target.value,
              }))}
            />
            <Form.Control.Feedback type="invalid">
              {I18nService.getString('message_value_invalid')}
            </Form.Control.Feedback>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button
          onButtonSubmit={() => {
            hideModal();
            onComplete?.();
          }}
        >
          {I18nService.getString('button_dialog_cancel')}
        </Button>
        <Button
          className="primary"
          onButtonSubmit={handleSubmit}
        >
          {I18nService.getString('button_dialog_confirm')}
        </Button>
      </Modal.Footer>
    </>
  );
}

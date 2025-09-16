import React, {
  useCallback, useEffect, useRef, useState,
} from 'react';
import { Form, Modal } from 'react-bootstrap';

import { ModalComponent } from '../../contexts';
import { IMediaPlaylist, IMediaPlaylistUpdateData } from '../../interfaces';
import { I18nService, MediaPlaylistService } from '../../services';

import { Button } from '../button/button.component';

export const MediaPlaylistEditModal: ModalComponent<{
  mediaPlaylistId: string;
}, {
  updatedPlaylist: IMediaPlaylist,
}> = (props) => {
  const {
    mediaPlaylistId,
    onComplete,
  } = props;

  const [validated, setValidated] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [inputData, setInputData] = useState<IMediaPlaylistUpdateData>({
    name: '',
  });

  const handleSubmit = useCallback(async (event: any) => {
    event.preventDefault();
    setValidated(true);

    if (formRef.current?.checkValidity()) {
      const updatedPlaylist = await MediaPlaylistService.updateMediaPlaylist(mediaPlaylistId, {
        name: inputData.name,
      });
      onComplete({ updatedPlaylist });
    }
  }, [
    inputData.name,
    mediaPlaylistId,
    onComplete,
  ]);

  useEffect(() => {
    MediaPlaylistService.getMediaPlaylist(mediaPlaylistId)
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
            onComplete();
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
};

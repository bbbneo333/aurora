import React, {
  useCallback, useEffect, useRef, useState,
} from 'react';
import { Form, Modal } from 'react-bootstrap';

import { ModalComponent } from '../../contexts';
import { IMediaTrack, IMediaTrackData } from '../../interfaces';
import { I18nService, MediaTrackService, MediaLibraryService } from '../../services';
import { CryptoService } from '../../modules/crypto/service';
import MediaLocalConstants from '../../providers/media-local/media-local.constants.json';

import { Button } from '../button/button.component';

export const MediaTrackEditModal: ModalComponent<{
  mediaTrackId: string;
}, {
  updatedTrack?: IMediaTrack,
}> = (props) => {
  const {
    mediaTrackId,
    onComplete,
  } = props;

  const [validated, setValidated] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [inputData, setInputData] = useState<Partial<IMediaTrackData> & { track_artist_name?: string }>({
    track_name: '',
    track_artist_name: '',
    track_number: undefined,
  });
  const [initialData, setInitialData] = useState<Partial<IMediaTrackData> & { track_artist_name?: string }>({});

  const handleSubmit = useCallback(async (event: any) => {
    event.preventDefault();
    setValidated(true);

    if (!formRef.current?.checkValidity()) {
      return;
    }

    const updateData: any = {
      track_name: inputData.track_name,
      track_number: inputData.track_number ? Number(inputData.track_number) : undefined,
    };

    if (inputData.track_artist_name !== initialData.track_artist_name && inputData.track_artist_name) {
      const artist = await MediaLibraryService.checkAndInsertMediaArtist({
        artist_name: inputData.track_artist_name,
        provider: MediaLocalConstants.Provider,
        provider_id: CryptoService.sha256(inputData.track_artist_name),
        sync_timestamp: Date.now(),
      });
      updateData.track_artist_ids = [artist.id];
    }

    const updatedTrack = await MediaTrackService.updateMediaTrack({
      id: mediaTrackId,
    }, updateData);

    onComplete({ updatedTrack });
  }, [
    inputData,
    initialData,
    mediaTrackId,
    onComplete,
  ]);

  useEffect(() => {
    MediaTrackService.getMediaTrack(mediaTrackId)
      .then((mediaTrack) => {
        if (!mediaTrack) {
          return;
        }

        const data = {
          track_name: mediaTrack.track_name,
          track_artist_name: mediaTrack.track_artists[0]?.artist_name || '',
          track_number: mediaTrack.track_number,
        };
        setInputData(data);
        setInitialData(data);
      });
  }, [
    mediaTrackId,
  ]);

  return (
    <>
      <Modal.Header>
        <Modal.Title>
          Edit Track
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form
          ref={formRef}
          noValidate
          validated={validated}
          onSubmit={handleSubmit}
        >
          <Form.Group controlId="track_name">
            <Form.Label>Name</Form.Label>
            <Form.Control
              required
              type="text"
              placeholder="Name"
              value={inputData.track_name}
              onChange={(e: any) => setInputData({ ...inputData, track_name: e.target.value })}
            />
            <Form.Control.Feedback type="invalid">
              {I18nService.getString('message_value_invalid')}
            </Form.Control.Feedback>
          </Form.Group>
          <Form.Group controlId="track_artist">
            <Form.Label>{I18nService.getString('label_artist_name')}</Form.Label>
            <Form.Control
              required
              type="text"
              placeholder={I18nService.getString('label_artist_name')}
              value={inputData.track_artist_name}
              onChange={(e: any) => setInputData({ ...inputData, track_artist_name: e.target.value })}
            />
            <Form.Control.Feedback type="invalid">
              {I18nService.getString('message_value_invalid')}
            </Form.Control.Feedback>
          </Form.Group>
          <Form.Group controlId="track_number">
            <Form.Label>Track Number</Form.Label>
            <Form.Control
              type="number"
              placeholder="Track Number"
              value={inputData.track_number || ''}
              onChange={(e: any) => setInputData({ ...inputData, track_number: e.target.value })}
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button
          onButtonSubmit={() => onComplete({})}
        >
          {I18nService.getString('button_dialog_cancel')}
        </Button>
        <Button
          variant="primary"
          onButtonSubmit={handleSubmit}
        >
          {I18nService.getString('button_dialog_confirm')}
        </Button>
      </Modal.Footer>
    </>
  );
};

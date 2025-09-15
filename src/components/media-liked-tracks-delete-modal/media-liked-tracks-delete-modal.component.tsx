import React from 'react';
import { Modal } from 'react-bootstrap';

import { ModalComponent } from '../../contexts';
import { useDataAction } from '../../hooks';
import { I18nService, MediaLikedTrackService } from '../../services';

import { Button } from '../button/button.component';

export const MediaLikedTracksDeleteModal: ModalComponent<{
  likedTracksIds: string[];
}, {
  deletedLikedTrackIds: string[];
}> = (props) => {
  const {
    likedTracksIds,
    onComplete,
  } = props;

  const deleteLikedTracks = useDataAction(async () => {
    await MediaLikedTrackService.removeTracksFromLiked(likedTracksIds);

    onComplete({
      deletedLikedTrackIds: likedTracksIds,
    });
  });

  return (
    <>
      <Modal.Header>
        <Modal.Title>
          {I18nService.getString('label_liked_tracks_delete')}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {I18nService.getString('label_liked_tracks_delete_details')}
      </Modal.Body>
      <Modal.Footer>
        <Button
          disabled={deleteLikedTracks.loading}
          onButtonSubmit={() => {
            onComplete();
          }}
        >
          {I18nService.getString('button_dialog_cancel')}
        </Button>
        <Button
          className="primary"
          disabled={deleteLikedTracks.loading}
          onButtonSubmit={deleteLikedTracks.perform}
        >
          {I18nService.getString('button_dialog_confirm')}
        </Button>
      </Modal.Footer>
    </>
  );
};

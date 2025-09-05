import React from 'react';
import { Modal } from 'react-bootstrap';

import { ModalComponent } from '../../contexts';
import { useDataAction, useDataLoad } from '../../hooks';
import { I18nService, MediaLibraryService } from '../../services';

import { Button } from '../button/button.component';
import { IMediaPlaylist } from '../../interfaces';

export const MediaPlaylistDeleteTracksModal: ModalComponent<{
  mediaPlaylistId: string;
  mediaPlaylistTrackIds: string[];
}, {
  updatedPlaylist: IMediaPlaylist,
  deletedPlaylistTrackIds: string[];
}> = (props) => {
  const {
    mediaPlaylistId,
    mediaPlaylistTrackIds,
    onComplete,
  } = props;

  const loadedPlaylist = useDataLoad(() => MediaLibraryService.getMediaPlaylist(mediaPlaylistId));
  const deletePlaylistTracks = useDataAction(async () => {
    const updatedPlaylist = await MediaLibraryService.deleteMediaPlaylistTracks(
      mediaPlaylistId,
      mediaPlaylistTrackIds,
    );

    onComplete({
      updatedPlaylist,
      deletedPlaylistTrackIds: mediaPlaylistTrackIds,
    });
  });

  return (
    <>
      <Modal.Header>
        <Modal.Title>
          {I18nService.getString('label_playlist_tracks_delete')}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {I18nService.getString('label_playlist_tracks_delete_details', {
          playlistName: <b>{loadedPlaylist.data?.name || ''}</b>,
        })}
      </Modal.Body>
      <Modal.Footer>
        <Button
          disabled={deletePlaylistTracks.loading}
          onButtonSubmit={() => {
            onComplete();
          }}
        >
          {I18nService.getString('button_dialog_cancel')}
        </Button>
        <Button
          className="primary"
          disabled={deletePlaylistTracks.loading}
          onButtonSubmit={deletePlaylistTracks.perform}
        >
          {I18nService.getString('button_dialog_confirm')}
        </Button>
      </Modal.Footer>
    </>
  );
};

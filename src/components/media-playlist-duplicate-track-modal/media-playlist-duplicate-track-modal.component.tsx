import React from 'react';
import { Modal } from 'react-bootstrap';
import { isEmpty } from 'lodash';

import { useModal } from '../../contexts';
import { IMediaPlaylist, IMediaPlaylistTrackInputData } from '../../interfaces';
import { I18nService, MediaLibraryService } from '../../services';
import { useDataAction, useDataLoad } from '../../hooks';
import { WithModalBaseProps } from '../../types';

import { Button } from '../button/button.component';

export function MediaPlaylistDuplicateTrackModal(props: WithModalBaseProps<{
  mediaPlaylistId: string;
  inputDataList: IMediaPlaylistTrackInputData[],
  existingTrackDataList: IMediaPlaylistTrackInputData[],
  newTrackDataList?: IMediaPlaylistTrackInputData[],
}, {
  updatedPlaylist: IMediaPlaylist,
  addedTrackDataList: IMediaPlaylistTrackInputData[],
}>) {
  const {
    mediaPlaylistId,
    inputDataList,
    existingTrackDataList,
    newTrackDataList = [],
    onComplete,
  } = props;

  const hasNewTracks = !isEmpty(newTrackDataList);
  const hasSingleDuplicateTrack = existingTrackDataList.length === 1;

  const { hideModal } = useModal();
  const loadedPlaylist = useDataLoad(() => MediaLibraryService.getMediaPlaylist(mediaPlaylistId));

  const addPlaylistTracks = useDataAction(async (
    playlistId: string,
    playlistTracks: IMediaPlaylistTrackInputData[],
    ignoreExisting: boolean = false,
  ) => {
    const updatedPlaylist = await MediaLibraryService.addMediaPlaylistTracks(playlistId, playlistTracks, {
      ignoreExisting,
    });

    hideModal();
    onComplete?.({
      updatedPlaylist,
      addedTrackDataList: playlistTracks,
    });
  });

  return (
    <>
      <Modal.Header>
        <Modal.Title>
          {I18nService.getString('label_playlist_track_duplicates')}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {hasNewTracks ? (
          I18nService.getString('label_playlist_tracks_some_exists', {
            playlistName: loadedPlaylist.data?.name || '',
          })
        ) : (
          I18nService.getString(hasSingleDuplicateTrack ? 'label_playlist_track_exists' : 'label_playlist_tracks_exists', {
            playlistName: loadedPlaylist.data?.name || '',
          })
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button
          disabled={!loadedPlaylist.data?.id}
          onButtonSubmit={() => {
            // add anyway // add all
            addPlaylistTracks.perform(
              loadedPlaylist.data?.id,
              inputDataList, // important - use the original input list to maintain order
              true,
            );
          }}
        >
          {hasSingleDuplicateTrack ? (
            I18nService.getString('button_playlist_add_existing_track')
          ) : (
            I18nService.getString('button_playlist_add_existing_tracks')
          )}
        </Button>
        <Button
          disabled={!loadedPlaylist.data?.id}
          className="primary"
          onButtonSubmit={() => {
            if (hasNewTracks) {
              // add new ones
              addPlaylistTracks.perform(
                loadedPlaylist.data?.id,
                newTrackDataList,
              );
            } else {
              // don't add
              hideModal();
              onComplete?.();
            }
          }}
        >
          {hasNewTracks ? (
            I18nService.getString('button_playlist_ignore_existing_tracks')
          ) : (
            I18nService.getString('button_playlist_ignore_existing_track')
          )}
        </Button>
      </Modal.Footer>
    </>
  );
}

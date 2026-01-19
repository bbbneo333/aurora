import React from 'react';
import { Modal } from 'react-bootstrap';

import { ModalComponent } from '../../contexts';
import { AppService, I18nService } from '../../services';

import { Button } from '../button/button.component';

export const MediaSettingsResetDialog: ModalComponent = (props) => {
  const { onComplete } = props;

  return (
    <>
      <Modal.Header>
        <Modal.Title>
          {I18nService.getString('label_settings_reset')}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {I18nService.getString('label_settings_reset_confirm_details')}
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
          variant={['danger']}
          onButtonSubmit={() => {
            AppService.resetAppData();
          }}
        >
          {I18nService.getString('button_dialog_confirm')}
        </Button>
      </Modal.Footer>
    </>
  );
};

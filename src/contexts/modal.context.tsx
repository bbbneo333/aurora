import React, { createContext, useState } from 'react';
import { Modal } from 'react-bootstrap';

export type ModalContextType = {
  isOpen: boolean;
  modalContent: React.ReactNode;
  showModal: (content: React.ReactNode) => void;
  hideModal: () => void;
};

const ModalContext = createContext<ModalContextType | null>(null);

export const ModalProvider = (props: {
  children: React.ReactNode,
}) => {
  const { children } = props;
  const [modalContent, setModalContent] = useState<React.ReactNode | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const showModal = (content: React.ReactNode) => {
    setModalContent(content);
    setIsOpen(true);
  };

  const hideModal = () => {
    setModalContent(null);
    setIsOpen(false);
  };

  return (
    <ModalContext.Provider value={{
      isOpen,
      modalContent,
      showModal,
      hideModal,
    }}
    >
      {children}
      <Modal
        show={isOpen}
        onHide={hideModal}
        backdrop="static"
        keyboard={false}
        centered
      >
        {modalContent}
      </Modal>
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = React.useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within ModalContext');
  }

  return context;
};

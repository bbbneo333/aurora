import React from 'react';
import { Modal } from 'react-bootstrap';

export type ModalComponent<P = {}, R = {}, E = Error> = React.ComponentType<P & {
  onComplete: (result?: R, error?: E) => void;
}>;

export type ModalOptions<R = any, E = any> = {
  onComplete?: (result?: R, error?: E) => void;
};

export type ShowModal = <P, R, E = Error>(
  Component: ModalComponent<P, R, E>,
  props?: P,
  options?: ModalOptions<R, E>
) => void;

export type ModalContextType = {
  isOpen: boolean;
  modalContent: React.ReactNode;
  showModal: ShowModal;
};

const ModalContext = React.createContext<ModalContextType | null>(null);

export const ModalProvider = ({ children }: { children: React.ReactNode }) => {
  const [modalContent, setModalContent] = React.useState<React.ReactNode | null>(null);
  const [isOpen, setIsOpen] = React.useState(false);

  const modalOptionsRef = React.useRef<ModalOptions | null>(null);

  const hideModal = React.useCallback(<R, E = Error>(result?: R, error?: E) => {
    setModalContent(null);
    setIsOpen(false);

    try {
      modalOptionsRef.current?.onComplete?.(result, error);
    } catch (err) {
      if (err instanceof Error) {
        console.error('Error in onComplete:', err.message);
      }
      console.error(err);
    } finally {
      modalOptionsRef.current = null;
    }
  }, []);

  const showModal: ShowModal = React.useCallback((Component, mProps, mOptions = {}) => {
    modalOptionsRef.current = mOptions;
    setModalContent(
      // @ts-ignore
      <Component
        {...mProps}
        onComplete={hideModal}
      />,
    );
    setIsOpen(true);
  }, [hideModal]);

  return (
    <ModalContext.Provider value={{ isOpen, modalContent, showModal }}>
      {children}
      <Modal
        show={isOpen}
        onHide={() => hideModal()}
        backdrop="static"
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

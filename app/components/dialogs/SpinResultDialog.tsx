import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  freeEntry: boolean;
  amount: number;
}

const SpinResultDialog = ({ isOpen, onClose, freeEntry, amount }: Props) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} placement="center" backdrop="blur">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1 text-center text-2xl font-serif text-primary">
              Congratulations!
            </ModalHeader>
            <ModalBody className="flex flex-col items-center py-6">
              <div className="text-6xl mb-4">🎉</div>
              <p className="text-xl font-medium text-center">
                {freeEntry
                  ? "You won Free Entry! No entry fee needed."
                  : `You won ₹${amount} off your entry fee!`}
              </p>
            </ModalBody>
            <ModalFooter className="flex justify-center w-full">
              <Button
                color="primary"
                onPress={onClose}
                className="w-full font-bold text-lg rounded-full"
                size="lg"
              >
                Continue
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default SpinResultDialog;

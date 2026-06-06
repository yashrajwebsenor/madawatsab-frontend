import { DialogProps } from "@/app/types/types";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";

const SpinResultDialog = ({ isOpen, onClose, data }: DialogProps) => {
  const isWinner = data && data.includes("Coins");

  return (
    <Modal isOpen={isOpen} onClose={onClose} placement="center" backdrop="blur">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1 text-center text-2xl font-serif text-primary">
              {isWinner ? "Congratulations!" : "Oops!"}
            </ModalHeader>
            <ModalBody className="flex flex-col items-center py-6">
              <div className="text-6xl mb-4">{isWinner ? "🎉" : "😔"}</div>
              <p className="text-xl font-medium text-center">
                {isWinner ? `You won ${data}!` : data}
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

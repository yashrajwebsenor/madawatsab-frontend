import { Modal, ModalContent, ModalBody, Button } from "@heroui/react";
import { useState, useEffect, useCallback } from "react";
import { HiChevronLeft, HiChevronRight, HiXMark } from "react-icons/hi2";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { DialogProps, Photo } from "@/app/types/types";

interface Props extends DialogProps {
  photos: Photo[];
  isSingle?: boolean;
  initialIndex?: number;
}

const ViewPhotosDialog = ({
  isOpen,
  onClose,
  photos,
  isSingle = false,
  initialIndex = 0,
}: Props) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
    }
  }, [isOpen, initialIndex]);

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
  }, [photos.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
  }, [photos.length]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handlePrevious();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "Escape") onClose();
    },
    [handlePrevious, handleNext, onClose],
  );

  useEffect(() => {
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleKeyDown]);

  if (!photos || photos.length === 0) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="full"
      classNames={{
        base: "bg-black",
        wrapper: "z-[9999]",
        closeButton: "hidden",
      }}
      motionProps={{
        variants: {
          enter: {
            y: 0,
            opacity: 1,
            transition: { duration: 0.3, ease: "easeOut" },
          },
          exit: {
            y: 20,
            opacity: 0,
            transition: { duration: 0.2, ease: "easeIn" },
          },
        },
      }}
    >
      <ModalContent>
        {() => (
          <ModalBody className="p-0 relative h-screen w-screen flex flex-col overflow-hidden bg-black">
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-50 bg-gradient-to-b from-black/80 to-transparent">
              <span className="text-white/90 font-medium ml-4 drop-shadow-md">
                {currentIndex + 1} / {photos.length}
              </span>
              <Button
                isIconOnly
                variant="light"
                radius="full"
                className="text-white hover:bg-white/20"
                onClick={onClose}
              >
                <HiXMark size={28} />
              </Button>
            </div>

            <div className="flex-1 min-h-0 w-full flex items-center justify-center relative touch-none group">
              {!isSingle && (
                <div className="absolute left-4 z-40">
                  <Button
                    isIconOnly
                    variant="flat"
                    radius="full"
                    className={clsx(
                      "bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10 transition-all duration-300",
                      "opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100",
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrevious();
                    }}
                  >
                    <HiChevronLeft size={24} />
                  </Button>
                </div>
              )}

              <div className="w-full h-full flex items-center justify-center p-4 md:p-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                    className="relative w-full h-full flex items-center justify-center"
                  >
                    <img
                      src={photos[currentIndex]?.url}
                      alt={`Photo ${currentIndex + 1}`}
                      className="max-h-full max-w-full object-contain drop-shadow-2xl rounded-lg"
                      draggable={false}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>

              {!isSingle && (
                <div className="absolute right-4 z-40">
                  <Button
                    isIconOnly
                    variant="flat"
                    radius="full"
                    className={clsx(
                      "bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10 transition-all duration-300",
                      "opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100",
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNext();
                    }}
                  >
                    <HiChevronRight size={24} />
                  </Button>
                </div>
              )}
            </div>

            {!isSingle && (
              <div className="w-full flex-shrink-0 bg-black/60 backdrop-blur-sm border-t border-white/10 p-4 md:p-6 flex justify-center">
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide max-w-[95vw] md:max-w-[80vw]">
                  {photos.map((photo, index) => (
                    <motion.div
                      key={photo._id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={clsx(
                        "relative cursor-pointer flex-shrink-0 transition-all duration-300 rounded-md overflow-hidden border-2",
                        currentIndex === index
                          ? "border-primary-500 scale-105 shadow-lg shadow-primary-500/40"
                          : "border-transparent opacity-50 grayscale-[0.3] hover:opacity-100 hover:grayscale-0",
                      )}
                      onClick={() => setCurrentIndex(index)}
                    >
                      <img
                        src={photo.url}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-14 h-14 md:w-20 md:h-20 object-cover"
                      />
                      {currentIndex === index && (
                        <motion.div
                          layoutId="active-indicator"
                          className="absolute inset-0 bg-primary-500/10"
                        />
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </ModalBody>
        )}
      </ModalContent>
    </Modal>
  );
};

export default ViewPhotosDialog;

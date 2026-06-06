import { AttachmentTypes } from "@/app/types/enum";
import { Advertisement, DialogProps } from "@/app/types/types";
import CommonUtils from "@/app/utils/common.utils";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Image,
} from "@heroui/react";
import { FiExternalLink } from "react-icons/fi";

interface Props extends DialogProps {
  data: Advertisement;
}

const AdvertisementDialog = ({ isOpen, onClose, data }: Props) => {
  if (!data) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" radius="lg">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="text-xl font-bold text-primary">
              Sponsored
            </ModalHeader>
            <ModalBody>
              <div className="flex flex-col gap-4">
                {data?.banner?.type === AttachmentTypes.ad_banner ? (
                  <Image
                    alt={data.title}
                    src={data.banner?.url}
                    className="w-full h-[300px] object-cover rounded-2xl"
                  />
                ) : (
                  <video
                    loop
                    autoPlay
                    src={data.banner?.url}
                    className="w-full h-[300px] object-cover rounded-2xl"
                  />
                )}
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-default-800">
                    {data.title}
                  </h3>
                  <p className="text-sm text-default-600 leading-relaxed">
                    {data.description}
                  </p>
                </div>
              </div>
            </ModalBody>

            <ModalFooter>
              <Button
                variant="flat"
                onPress={onClose}
                className="bg-pink-100 text-pink-600 font-medium"
              >
                Close
              </Button>
              {data.ctaUrl && (
                <Button
                  onPress={() =>
                    CommonUtils.handleAdvertisementAction({
                      ctaUrl: data.ctaUrl!,
                      _id: data._id!,
                    })
                  }
                  endContent={<FiExternalLink size={16} />}
                  className="bg-primary text-white font-medium"
                >
                  {data.ctaText || "Click Now"}
                </Button>
              )}
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default AdvertisementDialog;

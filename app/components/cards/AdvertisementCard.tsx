import { Advertisement } from "@/app/types/types";
import { Button, Card, CardBody, Image } from "@heroui/react";
import { useState } from "react";
import { RiAdvertisementFill } from "react-icons/ri";
import AdvertisementDialog from "../dialogs/AdvertisementDialog";
import CommonUtils from "@/app/utils/common.utils";
import { AttachmentTypes } from "@/app/types/enum";

const AdvertisementCard = ({
  banner,
  description,
  title,
  ctaText,
  ctaUrl,
  _id,
}: Advertisement) => {
  const [modal, setModal] = useState<any>({
    isOpen: false,
    data: null,
  });

  return (
    <Card
      as="div"
      isPressable
      shadow="none"
      onPress={() =>
        setModal({
          isOpen: true,
          data: {
            title: title,
            description: description,
            banner: banner,
            ctaText: ctaText,
            ctaUrl: ctaUrl,
            _id: _id,
          },
        })
      }
      className="border-none bg-white h-full hover:shadow-md transition-shadow duration-300"
    >
      <CardBody className="p-0 overflow-visible">
        <div className="relative overflow-hidden">
          {banner?.type === AttachmentTypes.ad_banner ? (
            <Image
              isZoomed
              alt={title}
              width="100%"
              src={banner?.url}
              className="object-cover w-full h-[200px]"
            />
          ) : (
            <video
              loop
              muted
              autoPlay
              src={banner?.url}
              className="object-cover w-full h-[200px]"
            />
          )}
          <div className="absolute top-3 left-3 z-20">
            <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase border border-white/20">
              <RiAdvertisementFill className="text-yellow-400" />
              Sponsored
            </div>
          </div>
        </div>

        <div className="p-4 flex flex-col flex-1">
          <div className="mb-2">
            <h4 className="font-bold text-base text-gray-800 line-clamp-1 hover:text-[#1a4d2e] transition-colors">
              {title}
            </h4>
            <p className="text-gray-500 text-xs mt-1.5 line-clamp-2 leading-relaxed">
              {description}
            </p>
          </div>

          {ctaUrl && (
            <div className="mt-auto pt-2">
              <Button
                fullWidth
                size="sm"
                variant="solid"
                style={{ backgroundColor: "#1a4d2e" }}
                className="text-white font-bold"
                onPress={() =>
                  CommonUtils.handleAdvertisementAction({ ctaUrl, _id })
                }
              >
                {ctaText || "Check Details"}
              </Button>
            </div>
          )}
        </div>
      </CardBody>

      {modal.isOpen && (
        <AdvertisementDialog
          data={modal.data}
          isOpen={modal.isOpen}
          onClose={() => setModal({ isOpen: false, data: null })}
        />
      )}
    </Card>
  );
};

export default AdvertisementCard;

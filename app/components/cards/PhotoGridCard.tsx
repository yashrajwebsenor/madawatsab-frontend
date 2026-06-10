import { Button, Card, CardBody, Chip, Image, Spinner } from "@heroui/react";
import clsx from "clsx";
import { IoClose } from "react-icons/io5";

type Props = {
  url: string;
  onRemove?: () => void;
  pending?: boolean;
  uploading?: boolean;
};

const PhotoGridCard = ({ url, onRemove, pending, uploading }: Props) => {
  return (
    <Card
      isHoverable
      className={clsx(
        "group relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-default-100 shadow-sm transition-all duration-300 hover:shadow-lg border-none",
        uploading && "animate-pulse",
      )}
    >
      <CardBody className="p-0 overflow-hidden">
        <Image
          removeWrapper
          src={url}
          alt="Profile"
          className={clsx(
            "z-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110",
            uploading && "scale-105 blur-[1px]",
          )}
        />

        {uploading && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
            <Spinner size="sm" color="white" variant="gradient" />
          </div>
        )}

        {pending && (
          <Chip
            size="sm"
            color="warning"
            variant="solid"
            className="absolute left-2 top-2 z-20"
          >
            Pending review
          </Chip>
        )}

        <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/40 via-transparent to-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {onRemove && !uploading && (
          <Button
            isIconOnly
            size="sm"
            radius="full"
            onPress={onRemove}
            className="absolute right-3 top-3 z-20 bg-black/40 text-white backdrop-blur-md transition-all duration-300 hover:bg-danger hover:text-white hover:scale-110 opacity-90 border border-white/20 shadow-lg"
          >
            <IoClose size={18} />
          </Button>
        )}
      </CardBody>
    </Card>
  );
};

export default PhotoGridCard;

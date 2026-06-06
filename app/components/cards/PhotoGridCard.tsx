import { Button, Card, CardBody, Image } from "@heroui/react";
import { IoClose } from "react-icons/io5";

type Props = {
  url: string;
  onRemove?: () => void;
};

const PhotoGridCard = ({ url, onRemove }: Props) => {
  return (
    <Card
      isHoverable
      className="group relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-default-100 shadow-sm transition-all duration-300 hover:shadow-lg border-none"
    >
      <CardBody className="p-0 overflow-hidden">
        <Image
          removeWrapper
          src={url}
          alt="Profile"
          className="z-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
        />

        <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/40 via-transparent to-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {onRemove && (
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

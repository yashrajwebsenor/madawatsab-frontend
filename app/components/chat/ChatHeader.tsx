import useChatStore from "@/app/store/useChatStore";
import { Avatar, Button } from "@heroui/react";
import clsx from "clsx";
import { IoMdInformationCircleOutline } from "react-icons/io";

const ChatHeader = ({ roomId }: { roomId: string }) => {
  const { participants } = useChatStore();

  const pariticipant = participants[roomId!];

  return (
    <div className="h-[60px] px-5 w-full border-b flex justify-between items-center">
      <div className="flex items-center gap-2">
        <Avatar
          isBordered
          color="primary"
          name={pariticipant?.fullName}
          src={pariticipant?.profilePhoto?.url}
          className={clsx(
            "w-8 h-8 text-large ring-2 ring-offset-2 ring-transparent group-hover:ring-primary/20 transition-all",
            { "blur-[2px]": pariticipant?.shouldBlur ?? pariticipant?.isPrivate },
          )}
        />
        <div className="flex flex-col items-start">
          <p className="font-medium text-gray-800 text-sm">
            {pariticipant?.fullName}
          </p>
          <p className="text-xs text-gray-400">{pariticipant?.occupation}</p>
        </div>
      </div>

      <Button size="sm" variant="light">
        <IoMdInformationCircleOutline size={20} className="text-gray-600" />
      </Button>
    </div>
  );
};

export default ChatHeader;

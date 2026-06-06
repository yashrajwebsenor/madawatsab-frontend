import { ProfileFor } from "@/app/types/enum";
import CommonUtils from "@/app/utils/common.utils";
import clsx from "clsx";
import { IoPersonOutline, IoPeopleOutline } from "react-icons/io5";
import { LuBaby } from "react-icons/lu";
import { PiPersonLight, PiHandshakeLight } from "react-icons/pi";
import { FaCheckCircle } from "react-icons/fa";

type Props = {
  value: ProfileFor;
  selected: boolean;
  onSelect: () => void;
};

const iconMap: Record<ProfileFor, React.ReactNode> = {
  [ProfileFor.self]: <IoPersonOutline size={24} />,
  [ProfileFor.son]: <LuBaby size={24} />,
  [ProfileFor.daughter]: <PiPersonLight size={24} />,
  [ProfileFor.brother]: <IoPeopleOutline size={24} />,
  [ProfileFor.sister]: <IoPeopleOutline size={24} />,
  [ProfileFor.relative]: <PiHandshakeLight size={24} />,
  [ProfileFor.friend]: <PiHandshakeLight size={24} />,
};

const ProfileForCard = ({ value, selected, onSelect }: Props) => {
  return (
    <div
      onClick={onSelect}
      className={clsx(
        "relative flex flex-col items-center justify-center p-6 rounded-[2rem] transition-all duration-300 cursor-pointer border-2 shadow-sm",
        selected
          ? "bg-primary border-transparent text-white"
          : "bg-white border-primary text-primary hover:border-primary",
      )}
    >
      {selected && (
        <div className="absolute top-3 right-3 text-white">
          <FaCheckCircle size={18} />
        </div>
      )}

      <div
        className={clsx(
          "w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-colors",
          selected ? "bg-[#ffffff1a]" : "bg-primary",
        )}
      >
        <span className={selected ? "text-white" : "text-white"}>
          {iconMap[value]}
        </span>
      </div>

      <span
        className={clsx(
          "text-sm capitalize",
          selected ? "font-semibold" : "font-medium",
        )}
      >
        {CommonUtils.formatTitle(value)}
      </span>
    </div>
  );
};

export default ProfileForCard;

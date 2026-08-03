import { FaCrown } from "react-icons/fa";

const PremiumBadge = () => {
  return (
    <div
      className="absolute left-2 top-2 z-20 flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow"
      aria-label="Premium Member"
    >
      <FaCrown size={10} />
      Premium
    </div>
  );
};

export default PremiumBadge;

import { BsGem } from "react-icons/bs";

// VVIP tier marker. Supersedes PremiumBadge — a VVIP is always a paying
// subscriber, so showing both would be redundant.
const VvipBadge = () => {
  return (
    <div
      className="absolute left-2 top-2 z-20 flex items-center gap-1 overflow-hidden rounded-full bg-gradient-to-r from-[#8a6d1f] via-[#E9C349] to-[#8a6d1f] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest text-white shadow-md ring-1 ring-white/40"
      aria-label="VVIP Member"
    >
      <BsGem size={9} className="shrink-0" />
      VVIP
    </div>
  );
};

export default VvipBadge;

import { IoIosLock } from "react-icons/io";

const PrivateBadge = () => {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/20 text-white">
      <div className="bg-white/20 backdrop-blur-md p-2 rounded-full mb-2">
        <IoIosLock size={24} />
      </div>
      <p className="text-[10px] font-bold uppercase tracking-wider">
        Private Profile
      </p>
    </div>
  );
};

export default PrivateBadge;

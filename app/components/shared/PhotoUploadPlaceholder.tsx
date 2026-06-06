import { FaPlus } from "react-icons/fa6";

type Props = {
  onChange?: (file: File) => void;
};

const PhotoUploadPlaceholder = ({ onChange }: Props) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onChange?.(file);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <input
        type="file"
        id="photo-upload"
        aria-label="Upload photo"
        className="hidden"
        onChange={handleChange}
        accept="image/png, image/jpeg, image/jpg"
      />

      <label
        htmlFor="photo-upload"
        className="
          w-[200px] 
          aspect-[4/5] 
          flex 
          items-center 
          justify-center 
          border-2 
          border-dashed 
          border-gray-300 
          rounded-xl 
          cursor-pointer 
          hover:bg-gray-50 
          transition-colors
        "
      >
        <FaPlus className="text-primary text-2xl opacity-60" />
      </label>

      <span className="text-xs text-gray-500 text-center w-[200px]">
        Add Photo
      </span>
    </div>
  );
};

export default PhotoUploadPlaceholder;

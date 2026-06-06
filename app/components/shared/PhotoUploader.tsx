import clsx from "clsx";
import { useRef, useState } from "react";
import { LuCloudUpload } from "react-icons/lu";

type Props = {
  onChange?: (file: File) => void;
};

const PhotoUploader = ({ onChange }: Props) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file && onChange) {
      onChange(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onChange) {
      onChange(file);
    }
  };

  const onBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={onBrowseClick}
      className={clsx(
        "w-full relative flex flex-col items-center justify-center p-10 transition-all duration-200 border-2 border-dashed rounded-xl",
        isDragging
          ? "border-indigo-500 bg-indigo-50/50 scale-[1.01]"
          : "border-slate-200 bg-slate-50/30 hover:border-slate-300",
      )}
    >
      <input
        type="file"
        aria-label="Upload photo"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
      />

      <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-indigo-50 text-indigo-500">
        <LuCloudUpload size={32} />
      </div>

      <div className="text-center">
        <p className="font-medium text-slate-700">
          Drag & drop files or{" "}
          <span className="text-indigo-600 underline transition-colors hover:text-indigo-700">
            Browse
          </span>
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Supported formats: JPEG, JPG & PNG
        </p>
      </div>
    </div>
  );
};

export default PhotoUploader;

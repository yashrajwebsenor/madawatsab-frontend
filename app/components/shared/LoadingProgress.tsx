import { CircularProgress } from "@heroui/react";

const LoadingProgress = () => {
  return (
    <div className="my-3 flex items-center justify-center w-full p-3">
      <CircularProgress />
    </div>
  );
};

export default LoadingProgress;

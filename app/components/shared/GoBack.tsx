"use client";

import { Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { HiArrowLeft } from "react-icons/hi2";

const GoBack = () => {
  const router = useRouter();

  return (
    <Button
      isIconOnly
      variant="light"
      color="primary"
      onPress={() => router.back()}
    >
      <HiArrowLeft size={20} />
    </Button>
  );
};

export default GoBack;

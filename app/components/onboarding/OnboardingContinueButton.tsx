import { Button, ButtonProps } from "@heroui/react";
import clsx from "clsx";
import { FiArrowRight } from "react-icons/fi";

interface Props extends ButtonProps {
  title?: string;
}

const OnboardingContinueButton = (props: Props) => {
  return (
    <Button
      size="lg"
      fullWidth
      {...props}
      radius="full"
      endContent={<FiArrowRight size={20} className="stroke-[3px]" />}
      className={clsx(
        "bg-gradient-to-r from-[#d4af37] via-[#c5a028] to-[#b8860b] text-white font-bold uppercase tracking-widest px-8 py-6",
        props.className,
      )}
    >
      {props.title ?? "Continue"}
    </Button>
  );
};

export default OnboardingContinueButton;

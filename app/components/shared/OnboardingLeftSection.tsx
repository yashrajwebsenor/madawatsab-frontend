import Image from "next/image";
import GoBack from "./GoBack";

type Props = {
  title: string;
  goBack?: boolean;
  description?: string;
};

const OnboardingLeftSection = ({ goBack, title, description }: Props) => {
  return (
    <div className="max-w-[400px] w-full text-center relative">
      <div className="flex items-end gap-2 justify-center">
        {goBack && <GoBack />}
        <Image
          alt="logo"
          width={50}
          height={50}
          src={"/assets/images/logo.png"}
        />
        <h1 className="font-semibold text-primary text-4xl drop-shadow-sm">
          Mada<span className="text-secondary">watsab</span>
        </h1>
      </div>
      <Image
        alt="underline"
        width={200}
        height={200}
        src="/assets/images/underline.png"
        className="w-[150px] mx-auto h-auto object-contain my-3"
      />
      <p className="text-primary text-3xl font-medium">{title}</p>
      {description && <p className="text-gray-800 mt-2">{description}</p>}
    </div>
  );
};

export default OnboardingLeftSection;

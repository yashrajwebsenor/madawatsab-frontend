import Image from "next/image";

type Props = {
  path: any;
  title: string;
  desc: string;
};

const AuthWidget = ({ path, title }: Props) => {
  return (
    <div className="flex flex-col text-center items-center">
      <Image
        alt="ss"
        src={path}
        height={300}
        width={300}
        className="w-[50px]"
      />
      <p className="font-medium text-center text-xs max-w-[50px] -mt-2 text-primary">
        {title}
      </p>
    </div>
  );
};

export default AuthWidget;

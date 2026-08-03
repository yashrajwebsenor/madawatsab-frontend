"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import routes from "../configs/route-paths";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  // Gate rendering on the token check so an authenticated user landing here
  // (e.g. via back-navigation) never sees a flash of the login/otp form
  // before being bounced onward.
  const [hasCheckedToken, setHasCheckedToken] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      router.replace(routes.home);
      return;
    }

    setHasCheckedToken(true);
  }, []);

  if (!hasCheckedToken) return null;

  return (
    <div className="relative h-screen w-full">
      <div className="inset-0 bg-white/20 absolute z-10" />
      <Image
        src="/assets/images/onboarding-bg.png"
        alt="Background"
        fill
        priority
        className="object-cover"
      />

      <p className="text-xs font-medium text-primary border-t border-primary absolute left-5 top-5 pt-1 uppercase">
        Bismillah
      </p>

      <div className="absolute w-full flex h-full items-center justify-center lg:gap-20 z-40 container">
        <div className="w-[500px] hidden lg:block relative">
          <div
            className="pointer-events-none absolute -inset-32 -z-10 rounded-[100%] bg-white/70 blur-3xl"
            aria-hidden
          />
          <div className="flex items-end gap-1 [text-shadow:_0_2px_16px_rgb(255_255_255_/_90%),_0_0_30px_rgb(255_255_255_/_70%)]">
            <Image
              alt="Logo"
              height={25}
              width={25}
              src={"/assets/images/logo.png"}
              className="drop-shadow-[0_2px_16px_rgba(255,255,255,0.9)]"
            />
            <p className="text-primary font-medium">
              Mada<span className="text-[#BFA03C]">watsab</span>
            </p>
          </div>
          <p className="mt-5 text-4xl font-bold text-primary [text-shadow:_0_2px_16px_rgb(255_255_255_/_90%),_0_0_30px_rgb(255_255_255_/_70%)]">
            Welcome Back <br /> Mada
            <span className="text-[#BFA03C]">watsab</span>
          </p>
          <Image
            alt="underline"
            width={200}
            height={200}
            className="w-[150px] h-auto object-contain"
            src="/assets/images/underline.png"
          />
          <p className="mt-3 font-medium text-primary [text-shadow:_0_2px_16px_rgb(255_255_255_/_90%),_0_0_30px_rgb(255_255_255_/_70%)]">
            Log in to a trusted platform to build meaningful relationships{" "}
            rooted in n faith, respect, and shared values.
          </p>
        </div>
        <div className="w-full lg:w-[500px]">{children}</div>
      </div>
    </div>
  );
};

export default AuthLayout;

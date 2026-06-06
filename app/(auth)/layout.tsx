"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import routes from "../configs/route-paths";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");

      if (token) {
        router.replace(routes.home);
      }
    }
  }, []);

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

      <div className="absolute w-full flex h-full items-center justify-center gap-20 z-40 container">
        <div className="w-[500px] sm:block hidden">
          <div className="flex items-end gap-1">
            <Image
              alt="Logo"
              height={25}
              width={25}
              src={"/assets/images/logo.png"}
            />
            <p className="text-primary font-medium">
              Mada<span className="text-secondary">watsab</span>
            </p>
          </div>
          <p className="mt-5 text-4xl font-bold text-primary">
            Welcome Back <br /> Mada
            <span className="text-secondary">watsab</span>
          </p>
          <Image
            alt="underline"
            width={200}
            height={200}
            className="w-[150px] h-auto object-contain"
            src="/assets/images/underline.png"
          />
          <p className="mt-3 font-medium text-primary">
            Log in to a trusted platform to build meaningful relationships{" "}
            rooted in n faith, respect, and shared values.
          </p>
        </div>
        <div className="sm:w-[500px] w-full">{children}</div>
      </div>
    </div>
  );
};

export default AuthLayout;

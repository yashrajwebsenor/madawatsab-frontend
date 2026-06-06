"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import routes from "@/app/configs/route-paths";
import SplashScreen from "../shared/SplashScreen";
import useProfile from "@/app/hooks/useProfile";
import api from "@/app/api/api";
import ENDPOINTS from "@/app/api/endpoints";
import useConfigStore from "@/app/store/useConfigStore";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { getMyProfile } = useProfile();
  const { setConfig } = useConfigStore();
  const [isAuthorized, setIsAuthorized] = useState(false);

  const getConfigs = async () => {
    try {
      const res = await api.get(ENDPOINTS.CONFIGS.GET);
      setConfig(res?.data ?? null);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      getMyProfile();
      getConfigs();
    }

    const isPublicPath = pathname.startsWith("/auth");

    if (!token && !isPublicPath) {
      router.push(routes.auth.login);
    } else {
      setIsAuthorized(true);
    }
  }, [pathname, router]);

  if (!isAuthorized && !pathname.startsWith("/auth")) {
    return <SplashScreen />;
  }

  return <>{children}</>;
}

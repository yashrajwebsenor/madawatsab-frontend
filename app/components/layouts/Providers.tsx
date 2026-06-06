"use client";

import { HeroUIProvider, ToastProvider } from "@heroui/react";
import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 0,
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      select: (data: any) => data?.data ?? data,
    },
  },
});

const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <HeroUIProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <ToastProvider placement="top-right" />
        <Toaster position="top-right" richColors expand={true} closeButton />
      </QueryClientProvider>
    </HeroUIProvider>
  );
};

export default Providers;

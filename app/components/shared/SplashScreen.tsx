"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Spinner } from "@heroui/react";

const SplashScreen = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background text-foreground overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col items-center gap-8"
      >
        <motion.div
          animate={{ y: [0, -15, 0] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative w-36 h-36 md:w-48 md:h-48 drop-shadow-2xl"
        >
          <Image
            src="/assets/images/logo.png"
            alt="Loading..."
            fill
            className="object-contain"
            priority
          />
        </motion.div>

        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" color="primary" />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-default-500 font-medium tracking-wide animate-pulse"
          >
            Preparing your experience...
          </motion.p>
        </div>
      </motion.div>

      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-secondary/5 blur-[120px]" />
      </div>
    </div>
  );
};

export default SplashScreen;

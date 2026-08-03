"use client";

import { motion } from "framer-motion";
import { FiUser } from "react-icons/fi";

/**
 * Purely decorative, self-contained animated "ID card" hero for the identity
 * verification prompt. Deliberately generic — a stylised smart-card, NOT the
 * real Aadhaar artwork/logo. Motion: a floating card, a repeating scan line, a
 * shimmer sweep, and a check-seal that draws itself in once.
 */
const IdCardAnimation = () => {
  return (
    <div className="relative mx-auto flex h-44 w-full max-w-[300px] items-center justify-center">
      {/* Soft glow behind the card */}
      <div className="absolute h-40 w-64 rounded-3xl bg-primary/20 blur-2xl" />

      <motion.div
        initial={{ y: 8, rotate: -3, opacity: 0 }}
        animate={{ y: [6, -6, 6], rotate: -3, opacity: 1 }}
        transition={{
          y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
          opacity: { duration: 0.5 },
        }}
        className="relative h-40 w-64 overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary-600 to-secondary-600 p-4 text-white shadow-2xl shadow-primary/30"
      >
        {/* Header row */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-white/80">
            Identity Card
          </span>
          {/* Smart-card chip */}
          <div className="h-5 w-7 rounded-[4px] bg-gradient-to-br from-amber-200 to-amber-400 shadow-inner" />
        </div>

        {/* Photo + detail lines */}
        <div className="mt-3 flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-white/25 backdrop-blur-sm">
            <FiUser className="text-2xl text-white/90" />
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <div className="h-2.5 w-24 rounded-full bg-white/70" />
            <div className="h-2 w-32 rounded-full bg-white/40" />
            <div className="h-2 w-20 rounded-full bg-white/40" />
          </div>
        </div>

        {/* Masked ID number */}
        <div className="mt-4 flex items-center gap-1.5">
          {[...Array(3)].map((_, group) => (
            <div key={group} className="flex gap-1">
              {[...Array(4)].map((_, dot) => (
                <span
                  key={dot}
                  className="h-1.5 w-1.5 rounded-full bg-white/60"
                />
              ))}
            </div>
          ))}
        </div>

        {/* Shimmer sweep */}
        <motion.div
          initial={{ x: "-120%" }}
          animate={{ x: "220%" }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            repeatDelay: 1.6,
            ease: "easeInOut",
          }}
          className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-white/25 blur-md"
        />

        {/* Scan line */}
        <motion.div
          initial={{ top: "8%", opacity: 0 }}
          animate={{ top: ["8%", "88%", "8%"], opacity: [0, 1, 0] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
          className="pointer-events-none absolute inset-x-0 h-6 bg-gradient-to-b from-transparent via-white/40 to-transparent"
        />
      </motion.div>

      {/* Verified check-seal */}
      <motion.div
        initial={{ scale: 0, rotate: -30, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ delay: 0.7, type: "spring", stiffness: 220, damping: 12 }}
        className="absolute -bottom-1 -right-1 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-xl"
      >
        <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-success">
          <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none">
            <motion.path
              d="M5 12.5l4 4 10-10"
              stroke="white"
              strokeWidth={2.6}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 1, duration: 0.5, ease: "easeOut" }}
            />
          </svg>
        </div>
      </motion.div>
    </div>
  );
};

export default IdCardAnimation;

"use client";

import { motion } from "framer-motion";
import { BRAND_PATHS, BRAND_VIEWBOX } from "./brandLogoPaths";

// Inline brand mark. As an SVG (not <img>) so the splash can animate the three
// layers individually. Painted bottom-up: outer teal shell → inner teal → the
// gold center accent. Matrimony read: the two mirrored teal halves settle into
// place, then the gold center — the union — sparks to life and breathes.
//
//  - animated=false → static mark (navbar / loading screen), instant + crisp.
//  - animated=true  → staggered "bloom" intro used by SplashIntro.

interface BrandMarkProps {
  animated?: boolean;
  className?: string;
  title?: string;
}

// Each motion.g scales about its own bounding-box center.
const centerOrigin = {
  transformBox: "fill-box" as const,
  transformOrigin: "center" as const,
};

const BrandMark = ({
  animated = false,
  className,
  title = "Madawatsab",
}: BrandMarkProps) => {
  if (!animated) {
    return (
      <svg
        viewBox={BRAND_VIEWBOX}
        className={className}
        role="img"
        aria-label={title}
        fillRule="evenodd"
      >
        {BRAND_PATHS.map((p, i) => (
          <path key={i} d={p.d} fill={p.fill} />
        ))}
      </svg>
    );
  }

  const lastIndex = BRAND_PATHS.length - 1;

  return (
    <svg
      viewBox={BRAND_VIEWBOX}
      className={className}
      role="img"
      aria-label={title}
      fillRule="evenodd"
    >
      {BRAND_PATHS.map((p, i) => {
        const isGold = i === lastIndex;
        const delay = i * 0.22;

        if (isGold) {
          // The union: overshoot pop, then a single soft heartbeat, with a
          // gold glow that breathes via drop-shadow.
          return (
            <motion.g
              key={i}
              style={centerOrigin}
              initial={{ opacity: 0, scale: 0.55 }}
              animate={{
                opacity: 1,
                scale: [0.55, 1.14, 0.98, 1.05, 1],
                filter: [
                  "drop-shadow(0 0 0px rgba(192,139,65,0))",
                  "drop-shadow(0 0 18px rgba(192,139,65,0.65))",
                  "drop-shadow(0 0 6px rgba(192,139,65,0.25))",
                  "drop-shadow(0 0 12px rgba(192,139,65,0.45))",
                  "drop-shadow(0 0 4px rgba(192,139,65,0.15))",
                ],
              }}
              transition={{
                delay: delay + 0.35,
                duration: 1.1,
                ease: "easeOut",
                times: [0, 0.35, 0.55, 0.78, 1],
              }}
            >
              <path d={p.d} fill={p.fill} />
            </motion.g>
          );
        }

        return (
          <motion.g
            key={i}
            style={centerOrigin}
            initial={{ opacity: 0, scale: 0.78 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay,
              duration: 0.6,
              ease: [0.34, 1.4, 0.64, 1], // gentle overshoot
            }}
          >
            <path d={p.d} fill={p.fill} />
          </motion.g>
        );
      })}
    </svg>
  );
};

export default BrandMark;

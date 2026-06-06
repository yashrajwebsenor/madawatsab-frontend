"use client";

import { motion } from "framer-motion";

type Props = {
  isRead: boolean;
};

/**
 * Double-tick read receipt indicator.
 * - Single grey tick  → message sent (not yet delivered/read)
 * - Double grey ticks → message delivered (not read)
 * - Double blue ticks → message read
 */
const SeenMessageText = ({ isRead }: Props) => {
  const readColor = "#3b82f6"; // blue-500
  const sentColor = "#9ca3af"; // gray-400

  return (
    <motion.span
      key={isRead ? "read" : "unread"}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="inline-flex items-center"
      title={isRead ? "Read" : "Sent"}
    >
      {/* Double-tick SVG — same approach as WhatsApp */}
      <svg
        width="16"
        height="11"
        viewBox="0 0 16 11"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* First tick (left) */}
        <path
          d="M1 5.5L4.5 9L11 2"
          stroke={isRead ? readColor : sentColor}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Second tick (right, offset) */}
        <path
          d="M5 5.5L8.5 9L15 2"
          stroke={isRead ? readColor : sentColor}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </motion.span>
  );
};

export default SeenMessageText;

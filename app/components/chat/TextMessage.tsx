"use client";

import { Message } from "@/app/types/types";
import { clsx } from "clsx";
import dayjs from "dayjs";
import { motion } from "framer-motion";
import { useState } from "react";
import { FiCheck, FiCopy } from "react-icons/fi";
import { toast } from "sonner";
import SeenMessageText from "./SeenMessageText";

type Props = {
  message: Message;
  isMe: boolean;
  showSeen?: boolean;
};

const TextMessage = ({ message, isMe, showSeen }: Props) => {
  const [copied, setCopied] = useState(false);
  const time = dayjs(message.createdAt).format("hh:mm A");

  const handleCopy = () => {
    if (typeof window !== "undefined" && message.content) {
      navigator.clipboard.writeText(message.content);
      setCopied(true);
      toast.success("Copied to clipboard", {
        position: "top-right",
        duration: 1000,
      });
      setTimeout(() => setCopied(false), 1000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={clsx(
        "flex w-full mb-2 px-2 group",
        isMe ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={clsx(
          "flex flex-col gap-1 w-full max-w-[85%] sm:max-w-[70%]",
          isMe ? "items-end" : "items-start",
        )}
      >
        <div className="relative flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full hover:bg-content3/50 text-foreground/40 hover:text-foreground/80"
            title="Copy text"
          >
            {copied ? (
              <FiCheck size={14} className="text-success" />
            ) : (
              <FiCopy size={14} />
            )}
          </button>

          <div
            className={clsx(
              "px-3 py-1.5 shadow-sm transition-all duration-200",
              isMe
                ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-none"
                : "bg-content2 text-foreground rounded-2xl rounded-tl-none border border-divider/5",
            )}
          >
            <p className="text-[13px] leading-relaxed break-words whitespace-pre-wrap">
              {message.content}
            </p>
          </div>
        </div>

        <div
          className={clsx(
            "flex items-center px-1 gap-1",
            isMe ? "text-foreground/40" : "text-foreground/40",
          )}
        >
          <span className="text-[10px] font-medium tabular-nums">{time}</span>
          {showSeen && isMe && <SeenMessageText isRead={message.isRead} />}
        </div>
      </div>
    </motion.div>
  );
};

export default TextMessage;

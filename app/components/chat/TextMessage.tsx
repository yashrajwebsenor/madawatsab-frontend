"use client";

import { Message } from "@/app/types/types";
import { clsx } from "clsx";
import dayjs from "dayjs";
import { motion } from "framer-motion";
import { useState } from "react";
import { FiCheck, FiCopy, FiSlash } from "react-icons/fi";
import { toast } from "sonner";
import SeenMessageText from "./SeenMessageText";
import MessageActionsMenu from "./MessageActionsMenu";

type Props = {
  message: Message;
  isMe: boolean;
  showSeen?: boolean;
  isHighlighted?: boolean;
};

const TextMessage = ({ message, isMe, showSeen, isHighlighted }: Props) => {
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
        <div className="relative flex items-center gap-1">
          <MessageActionsMenu message={message} isMe={isMe} />

          {!message.isDeleted && (
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
          )}

          {message.isDeleted ? (
            <div className="px-3 py-1.5 rounded-2xl bg-[#F1F5F4] border border-primary/10 text-[#274442]/50 italic">
              <p className="text-[13px] leading-relaxed flex items-center gap-1.5">
                <FiSlash size={13} /> This message was deleted
              </p>
            </div>
          ) : (
            <div
              className={clsx(
                "px-3 py-1.5 shadow-sm transition-all duration-500",
                isMe
                  ? "bg-[#91700A] text-white rounded-2xl rounded-tr-none"
                  : "bg-primary text-white rounded-2xl rounded-tl-none",
                // Green ring reads on the gold outgoing bubble; gold ring on
                // the green incoming bubble — visible on both.
                isHighlighted && (isMe ? "ring-2 ring-primary" : "ring-2 ring-secondary"),
              )}
            >
              <p className="text-[13px] leading-relaxed break-words whitespace-pre-wrap">
                {message.content}
              </p>
            </div>
          )}
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

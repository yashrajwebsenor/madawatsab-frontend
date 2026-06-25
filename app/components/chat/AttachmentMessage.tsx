"use client";

import { Message } from "@/app/types/types";
import { clsx } from "clsx";
import dayjs from "dayjs";
import { motion } from "framer-motion";
import { AttachmentTypes } from "@/app/types/enum";
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

const AttachmentMessage = ({
  message,
  isMe,
  showSeen,
  isHighlighted,
}: Props) => {
  const [copied, setCopied] = useState(false);
  const time = dayjs(message.createdAt).format("hh:mm A");
  const hasContent = message.content && message.content.trim().length > 0;
  const attachment = message.attachment;

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

  const renderAttachment = () => {
    if (!attachment?.url) return null;

    if (attachment.type === AttachmentTypes.chat_image) {
      return (
        <div className="relative w-full aspect-square max-h-[150px] overflow-hidden rounded-xl bg-content3/20">
          <img
            src={attachment.url}
            alt="Attachment"
            className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.open(attachment.url, "_blank");
              }
            }}
          />
        </div>
      );
    }

    if (attachment.type === AttachmentTypes.chat_video) {
      return (
        <div className="relative w-full rounded-xl overflow-hidden bg-black aspect-video">
          <video src={attachment.url} controls className="w-full h-full" />
        </div>
      );
    }

    return (
      <div
        className="flex items-center gap-3 p-3 rounded-xl bg-content3/30 border border-divider/10 cursor-pointer hover:bg-content3/50 transition-colors"
        onClick={() => window.open(attachment.url, "_blank")}
      >
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate">File Attachment</p>
          <p className="text-[10px] text-foreground/50 uppercase">
            {attachment.type}
          </p>
        </div>
      </div>
    );
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
          "flex flex-col gap-1 w-full max-w-[75%]",
          isMe ? "items-end" : "items-start",
        )}
      >
        <div className="relative flex items-center gap-1">
          <MessageActionsMenu message={message} isMe={isMe} />

          {!message.isDeleted && hasContent && (
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
            <div className="px-3 py-1.5 rounded-2xl bg-content2 border border-divider/5 text-foreground/50 italic">
              <p className="text-[13px] leading-relaxed flex items-center gap-1.5">
                <FiSlash size={13} /> This message was deleted
              </p>
            </div>
          ) : (
            <div
              className={clsx(
                "relative p-1 shadow-sm transition-all duration-500 overflow-hidden",
                isMe
                  ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-none"
                  : "bg-content2 text-foreground rounded-2xl rounded-tl-none border border-divider/5",
                isHighlighted && "ring-2 ring-primary",
              )}
            >
              <div className="w-full min-w-[200px]">{renderAttachment()}</div>

              {hasContent && (
                <div className="px-3 py-2">
                  <p className="text-[13px] leading-relaxed break-words whitespace-pre-wrap">
                    {message.content}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div
          className={clsx("flex items-center px-1 gap-1", "text-foreground/40")}
        >
          <span className="text-[10px] font-medium tabular-nums">{time}</span>
          {showSeen && isMe && <SeenMessageText isRead={message.isRead} />}
        </div>
      </div>
    </motion.div>
  );
};

export default AttachmentMessage;

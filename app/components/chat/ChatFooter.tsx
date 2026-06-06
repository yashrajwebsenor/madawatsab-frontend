import socketService from "@/app/socket";
import socketEvents from "@/app/socket/socket-config";
import useUserStore from "@/app/store/useUserStore";
import useSubscriptionAccess from "@/app/hooks/useSubscriptionAccess";
import { AttachmentTypes, MessageTypes } from "@/app/types/enum";
import { Button, Input } from "@heroui/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FiSend } from "react-icons/fi";
import { RiAttachmentLine } from "react-icons/ri";
import { BsEmojiSmile } from "react-icons/bs";
import { IoClose } from "react-icons/io5";
import { IoIosLock } from "react-icons/io";
import api from "@/app/api/api";
import ENDPOINTS from "@/app/api/endpoints";
import dynamic from "next/dynamic";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

const ChatFooter = () => {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useUserStore();
  const { canSendMessages } = useSubscriptionAccess();
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest(".emoji-btn-trigger")
      ) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSend = async (e: any) => {
    e?.preventDefault();
    if (!message.trim() && !selectedFile) return;

    try {
      let attachment;
      let type = MessageTypes.text;
      if (selectedFile) {
        setUploading(true);
        attachment = await handleUploadAttachment();
        type = selectedFile.type.startsWith("video/")
          ? MessageTypes.video
          : MessageTypes.image;
      }

      socketService.emit(socketEvents.EMIT.SEND_MESSAGE, {
        roomId: id,
        content: message,
        senderId: user?._id,
        attachment: attachment?.data?._id,
        type,
      });

      setMessage("");
      removeFile();
      setShowEmojiPicker(false);
    } catch (error) {
      console.log(error);
    } finally {
      setUploading(false);
    }
  };

  const handleUploadAttachment = async () => {
    if (!selectedFile) return null;
    const payload = new FormData();
    payload.append("file", selectedFile);
    const isVideo = selectedFile.type.startsWith("video/");
    payload.append("type", isVideo ? AttachmentTypes.chat_video : AttachmentTypes.chat_image);

    return await api.post(ENDPOINTS.ATTACHMENTS.UPLOAD, payload);
  };

  // Reading/receiving is open to everyone; sending requires a plan with
  // canMessage. Replace the composer with a locked bar that routes to pricing.
  if (!canSendMessages) {
    return (
      <button
        type="button"
        onClick={() => router.push("/pricing")}
        className="w-full p-4 border-t bg-white/90 backdrop-blur-xl flex items-center justify-center gap-2 sticky bottom-0 z-10 text-gray-500 hover:text-primary transition-colors"
      >
        <IoIosLock size={18} />
        <span className="text-sm font-medium">
          Chat is locked — subscribe to unlock chat
        </span>
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSend}
      className="p-3 md:p-4 border-t bg-white/90 backdrop-blur-xl flex items-end gap-2 sticky bottom-0 z-10"
    >
      <input
        type="file"
        ref={fileInputRef}
        aria-label="Upload image or video"
        className="hidden"
        accept="image/*,video/*"
        onChange={handleFileChange}
      />

      <div className="flex-1 flex flex-col gap-1.5 relative">
        {selectedFile && previewUrl && (
          <div className="flex items-center gap-2 bg-primary/5 self-start p-1.5 pr-3 rounded-xl border border-primary/10 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {selectedFile.type.startsWith("image/") ? (
              <div className="w-10 h-10 rounded-lg overflow-hidden border border-divider">
                <img
                  src={previewUrl}
                  alt="preview"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : selectedFile.type.startsWith("video/") ? (
              <div className="w-10 h-10 rounded-lg overflow-hidden border border-divider bg-black flex items-center justify-center">
                <video src={previewUrl} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-lg overflow-hidden border border-divider bg-primary/10 flex items-center justify-center text-primary">
                <RiAttachmentLine size={18} />
              </div>
            )}
            <div className="flex flex-col min-w-0 max-w-[150px]">
              <span className="text-[12px] font-medium text-gray-700 truncate">
                {selectedFile.name}
              </span>
              <span className="text-[10px] text-gray-400">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </span>
            </div>
            {!uploading && (
              <button
                type="button"
                onClick={removeFile}
                className="hover:bg-primary/10 rounded-full p-1 transition-colors ml-2"
              >
                <IoClose
                  size={16}
                  className="text-gray-500 hover:text-danger"
                />
              </button>
            )}
          </div>
        )}

        {showEmojiPicker && (
          <div
            ref={emojiPickerRef}
            className="absolute bottom-full right-0 mb-2 z-50 shadow-2xl rounded-2xl overflow-hidden border border-gray-100 animate-in fade-in slide-in-from-bottom-2 duration-200"
          >
            <EmojiPicker
              onEmojiClick={(emojiData) => {
                setMessage((prev) => prev + emojiData.emoji);
              }}
              lazyLoadEmojis={true}
              searchDisabled={false}
              skinTonesDisabled={true}
              height={380}
              width={320}
            />
          </div>
        )}

        <Input
          autoFocus
          placeholder="Type a message..."
          variant="flat"
          radius="full"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          endContent={
            <div className="flex items-center gap-1">
              <Button
                isIconOnly
                variant="light"
                radius="full"
                size="sm"
                type="button"
                onPress={() => fileInputRef.current?.click()}
                className="text-gray-400 hover:text-primary hover:bg-primary/10 transition-all duration-300 min-w-8 w-8 h-8"
              >
                <RiAttachmentLine size={20} />
              </Button>
              <Button
                isIconOnly
                variant="light"
                radius="full"
                size="sm"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEmojiPicker((prev) => !prev);
                }}
                className="emoji-btn-trigger text-gray-400 hover:text-primary hover:bg-primary/10 transition-all duration-300 min-w-8 w-8 h-8"
              >
                <BsEmojiSmile size={20} />
              </Button>
            </div>
          }
          classNames={{
            base: "max-w-full",
            inputWrapper: [
              "bg-gray-100/80",
              "hover:bg-gray-200/80",
              "focus-within:!bg-white",
              "focus-within:ring-2",
              "focus-within:ring-primary/20",
              "transition-all",
              "duration-300",
              "border-none",
              "shadow-sm",
            ].join(" "),
            input: "text-[15px] py-2",
          }}
        />
      </div>

      <Button
        size="sm"
        isIconOnly
        radius="full"
        type="submit"
        color="primary"
        isLoading={uploading}
        className="min-w-unit-10 w-10 h-10 shadow-md shadow-primary/30 hover:shadow-lg hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
      >
        <FiSend size={18} />
      </Button>
    </form>
  );
};

export default ChatFooter;

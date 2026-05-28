"use client";

import {
  ArrowUp,
  Plus,
  Image,
  Camera,
  Video,
  File,
  Loader2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { User } from "@/app/_utils/types/buyer";
import { websocket } from "@/app/services/websocket";
import useChat from "@/app/hooks/use-chat";
import MediaUploadModal from "./MediaUploadViewer";
import { useAuth } from "@/app/context/AuthContext";
import SmartReplyPreview from "./SmartReplyPreview";
import { useChatUtils } from "@/app/context/ChatContext";
// TYPES
interface SendMessageProps {
  selectedChat?: User;
}

type FileAcceptType = "image" | "video" | "file" | "camera" | "all";
// CONSTANTS
const FILE_ACCEPT_MAP: Record<FileAcceptType, string> = {
  image: "image/*,image/heic,image/heif",
  video: "video/mp4,video/quicktime,video/x-m4v,video/*",
  file: ".pdf,.doc,.docx,.zip,.xls,.xlsx,.ppt,.pptx,.txt,.csv",
  camera: "image/*;capture=camera",
  all: "image/*,video/*,.pdf,.doc,.docx,.zip",
};
// COMPONENT
const SendMessage = ({ selectedChat }: SendMessageProps) => {
  const { authDetails } = useAuth();
  const { replyTo, setReplyTo, activeUploadsRef } = useChatUtils();
  const [isFocused, setIsFocused] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [message, setMessage] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isSendingMedia, setIsSendingMedia] = useState(false);
  // Tracks which accept type is active so the input key forces a remount
  const [fileAcceptType, setFileAcceptType] = useState<FileAcceptType>("all");

  // REFS
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // HOOKS

  const {
    transmitMessage,
    prepareOptimisticMedia,
    uploadAndEmitMedia,
    useGetChatSignature,
  } = useChat();

  const getSignature = useGetChatSignature();

  // EFFECTS

  // Auto-focus textarea when a reply is set
  useEffect(() => {
    if (replyTo) {
      textareaRef.current?.focus();
    }
  }, [replyTo]);

  // Cleanup typing state on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      stopTyping();
    };
  }, []);

  // HELPERS

  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 112) + "px";
  };

  const openFilePicker = (type: FileAcceptType) => {
    setFileAcceptType(type);
    setShowMenu(false);
    // Defer click so the input remounts with the new accept attribute first
    setTimeout(() => {
      document.getElementById("chat-file-input")?.click();
    }, 0);
  };

  // TYPING─

  const stopTyping = () => {
    if (!selectedChat || !isTypingRef.current) return;
    websocket.emit("chat.typing", {
      user_id: selectedChat.id,
      is_typing: false,
    });
    isTypingRef.current = false;
  };

  const handleTyping = (value: string) => {
    setMessage(value);
    if (!selectedChat) return;

    if (!isTypingRef.current) {
      websocket.emit("chat.typing", {
        user_id: selectedChat.id,
        is_typing: true,
      });
      isTypingRef.current = true;
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(stopTyping, 1500);
  };

  // FILE HANDLING─────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // Filter files to only those matching the expected type
    const filtered = files.filter((file) => {
      switch (fileAcceptType) {
        case "image":
        case "camera":
          return file.type.startsWith("image/");
        case "video":
          return file.type.startsWith("video/");
        case "file":
          return (
            !file.type.startsWith("image/") && !file.type.startsWith("video/")
          );
        default:
          return true;
      }
    });

    setPendingFiles((prev) => [...prev, ...filtered]);
    e.target.value = "";
  };

  // SEND─

  const handleSend = async () => {
    if (!selectedChat) return;

    const recipient = selectedChat;

    // TEXT ONLY
    if (message.trim() && pendingFiles.length === 0) {
      transmitMessage({
        recipient: selectedChat,
        body: message.trim(),
        reply_to: replyTo,
      });
      resetInput();
      return;
    }

    // MEDIA
    const filesToSend = [...pendingFiles];
    const captionToSend = message.trim();

    const grouped: Record<"image" | "video" | "file", File[]> = {
      image: [],
      video: [],
      file: [],
    };

    filesToSend.forEach((file) => {
      if (file.type.startsWith("image/")) grouped.image.push(file);
      else if (file.type.startsWith("video/")) grouped.video.push(file);
      else grouped.file.push(file);
    });

    resetInput();
    setIsSendingMedia(true);

    try {
      await Promise.all(
        (["image", "video", "file"] as const)
          .filter((type) => grouped[type].length > 0)
          .map((type) =>
            uploadGroup(type, grouped[type], recipient, captionToSend),
          ),
      );
    } finally {
      setIsSendingMedia(false);
    }
  };

  const uploadGroup = async (
    type: "image" | "video" | "file",
    files: File[],
    recipient: User,
    caption: string,
  ) => {
    const clientId = await prepareOptimisticMedia({
      files,
      recipient,
      type,
      caption,
      reply_to: replyTo,
    });

    if (!clientId) return;

    activeUploadsRef.current.set(clientId, files);

    const raw = await getSignature.mutateAsync({
      upload_type: type,
      count: files.length,
    });

    const signatureItems = (raw.items || [raw.fields]).map((item: any) => ({
      fields: item,
      constraints: raw.constraints,
    }));

    await uploadAndEmitMedia({
      files,
      type,
      recipient_id: recipient.id,
      caption,
      signatures: signatureItems,
      clientId: [clientId],
      reply_to: replyTo,
    });
  };

  const resetInput = () => {
    setPendingFiles([]);
    setMessage("");
    stopTyping();
    setReplyTo(null);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const canSend = message.trim().length > 0 || pendingFiles.length > 0;

  return (
    <div className="w-full fixed bottom-0 z-10 md:relative py-2 px-3 md:px-6 border-t border-b border-[#00000033] bg-white">
      {/* Media preview modal */}
      {pendingFiles.length > 0 && (
        <MediaUploadModal
          files={pendingFiles}
          message={message}
          setMessage={setMessage}
          setFiles={setPendingFiles}
          onSend={handleSend}
          onAddMore={() => openFilePicker(fileAcceptType)}
          user={selectedChat}
          isSendingMedia={isSendingMedia}
        />
      )}

      {/* Reply preview bar */}
      {replyTo && (
        <div className="relative px-3 pb-1 pt-1 mb-1 w-full">
          <div
            className="flex items-center gap-3 px-3 py-2 bg-[#F4F4F4] rounded-[10px]"
            style={{ borderLeft: "4px solid #b07b1b" }}
          >
            <div className="flex-1">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide line-clamp-1">
                {replyTo.sender_id === authDetails?.user?.id
                  ? "Replying to yourself"
                  : `Replying to ${selectedChat?.full_name ?? "them"}`}
              </p>
              <SmartReplyPreview reply={replyTo} isSender={false} />
            </div>

            <button
              onClick={() => setReplyTo(null)}
              className="cursor-pointer p-2 hover:bg-black/10 rounded-full text-gray-500"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Attachment menu */}
      {showMenu && (
        <div className="absolute bottom-16 left-3 md:left-6 w-48 bg-white rounded-xl shadow-lg border border-gray-100 p-1 flex flex-col gap-1 z-50">
          <button
            onClick={() => openFilePicker("image")}
            className="flex items-center gap-2.5 px-3 py-2 hover:bg-[#f5f0f0] rounded-lg text-[13px]"
          >
            <Image size={12} className="text-[#007BFC]" />
            <span>Add Photos</span>
          </button>
          <button
            onClick={() => openFilePicker("video")}
            className="flex items-center gap-2.5 px-3 py-2 hover:bg-[#f5f0f0] rounded-lg text-[13px]"
          >
            <Video size={12} className="text-[#FF2E74]" />
            <span>Add Videos</span>
          </button>
          <button
            onClick={() => openFilePicker("file")}
            className="flex items-center gap-2.5 px-3 py-2 hover:bg-[#f5f0f0] rounded-lg text-[13px]"
          >
            <File size={12} className="text-[#333]" />
            <span>Files</span>
          </button>
          <button
            onClick={() => openFilePicker("camera")}
            className="flex items-center gap-2.5 px-3 py-2 hover:bg-[#f5f0f0] rounded-lg text-[13px]"
          >
            <Camera size={12} className="text-[#FF2E74]" />
            <span>Camera</span>
          </button>
        </div>
      )}

      {/* Input row */}
      <div className="flex items-center gap-3 bg-[#EFF3F4] border-[0.5px] border-orange rounded-[50px] px-1.5 py-2 shadow-sm">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className={`cursor-pointer w-7.5 h-7.5 flex items-center justify-center border rounded-full transition-all ${
            showMenu ? "bg-black text-white" : "text-black border-black"
          }`}
        >
          <Plus
            size={18}
            strokeWidth={1}
            className={`${showMenu ? "rotate-45" : "rotate-0"} transition-transform`}
          />
        </button>

        <textarea
          ref={textareaRef}
          rows={1}
          value={message}
          onChange={(e) => {
            handleTyping(e.target.value);
            autoResize(e.target);
          }}
          placeholder="Message"
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            stopTyping();
          }}
          onKeyDown={(e) => {
            if (e.shiftKey) return;
            if (e.key === "Enter") {
              e.preventDefault();
              if (e.nativeEvent.isComposing) return;
              handleSend();
            }
          }}
          className="flex-1 bg-transparent text-base focus:outline-none max-h-28 resize-none overflow-hidden overflow-y-auto leading-5 py-1"
        />

        {(isFocused || message) && (
          <button
            onClick={handleSend}
            disabled={!canSend || isSendingMedia}
            className="w-7.5 h-7.5 flex items-center justify-center bg-orange text-white rounded-full transition-all active:scale-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSendingMedia ? (
              <Loader2 size={18} strokeWidth={1} className="animate-spin" />
            ) : (
              <ArrowUp size={18} strokeWidth={1} />
            )}
          </button>
        )}
      </div>

      {/*
        Single hidden file input — remounts via key when accept type changes.
        This is the only reliable way to change the accept attribute on mobile.
      */}
      <input
        key={fileAcceptType}
        id="chat-file-input"
        type="file"
        accept={FILE_ACCEPT_MAP[fileAcceptType]}
        multiple={fileAcceptType !== "camera"}
        capture={fileAcceptType === "camera" ? "environment" : undefined}
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};

export default SendMessage;

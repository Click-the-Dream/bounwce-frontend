"use client";

import {
  ArrowUp,
  Plus,
  Image,
  Camera,
  Video,
  File,
  Loader2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { User } from "@/app/_utils/types/buyer";
import { websocket } from "@/app/services/websocket";
import useChat from "@/app/hooks/use-chat";
import MediaUploadModal from "./MediaUploadViewer";

interface ChatHeaderProps {
  selectedChat?: User;
  role?: "buyer" | "vendor";
}

const SendMessage = ({ selectedChat }: ChatHeaderProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [message, setMessage] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const fileRef = useRef<HTMLInputElement | null>(null);
  const [fileAccept, setFileAccept] = useState(
    "image/*,video/*,.pdf,.doc,.docx,.zip",
  );
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);
  const [isSendingMedia, setIsSendingMedia] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";

    const maxHeight = 112; // ~ max-h-28
    const newHeight = Math.min(el.scrollHeight, maxHeight);

    el.style.height = newHeight + "px";
  };

  const {
    transmitMessage,
    prepareOptimisticMedia,
    uploadAndEmitMedia,
    useGetChatImageSignature,
    useGetChatVideoSignature,
    useGetChatFileSignature,
  } = useChat();

  const imageSignature = useGetChatImageSignature();
  const videoSignature = useGetChatVideoSignature();
  const fileSignature = useGetChatFileSignature();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setPendingFiles((prev) => [...prev, ...files]);
    setShowMenu(false);
    e.target.value = "";
  };

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

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 1500);
  };

  const handleSend = async () => {
    if (!selectedChat) return;

    const recipient_id = selectedChat.id;

    // TEXT ONLY
    if (message.trim() && pendingFiles.length === 0) {
      await transmitMessage({ recipient_id, body: message.trim() });
      setMessage("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
      stopTyping();
      return;
    }

    // MEDIA
    const filesToSend = [...pendingFiles];
    const captionToSend = message.trim();

    // 1. Put ALL optimistic messages in cache synchronously
    const prepared = filesToSend.map((file) => {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      const type: "image" | "video" | "file" = isImage
        ? "image"
        : isVideo
          ? "video"
          : "file";

      const clientId = prepareOptimisticMedia({
        file,
        recipient_id,
        type,
        caption: captionToSend,
      });

      return { file, type, clientId };
    });

    // 2. Close modal immediately — chat already shows all images
    setPendingFiles([]);
    setMessage("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    stopTyping();

    // 3. Upload everything in background, no awaiting in UI
    for (const { file, type, clientId } of prepared) {
      if (!clientId) continue;

      (async () => {
        try {
          let signature;
          if (type === "image") signature = await imageSignature.mutateAsync();
          else if (type === "video")
            signature = await videoSignature.mutateAsync();
          else signature = await fileSignature.mutateAsync();

          await uploadAndEmitMedia({
            file,
            type,
            caption: captionToSend,
            recipient_id,
            signature,
            clientId,
          });
        } catch (err) {
          console.error("Upload failed for", clientId, err);
        }
      })();
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      stopTyping();
    };
  }, []);

  const canSend = message.trim().length > 0 || pendingFiles.length > 0;

  return (
    <div className="relative py-2 px-3 md:px-6 border-t border-b border-[#00000033] bg-white">
      {pendingFiles.length > 0 && (
        <MediaUploadModal
          files={pendingFiles}
          message={message}
          setMessage={setMessage}
          setFiles={setPendingFiles}
          onSend={handleSend}
          onAddMore={() => fileRef.current?.click()}
          user={selectedChat}
          isSendingMedia={isSendingMedia}
        />
      )}

      {showMenu && (
        <div className="absolute bottom-16 left-3 md:left-6 w-48 bg-white rounded-xl shadow-lg border border-gray-100 p-1 flex flex-col gap-1 z-50">
          {/* IMAGES */}
          <button
            onClick={() => {
              setFileAccept("image/*,image/heic,image/heif");
              fileRef.current?.click();
              setShowMenu(false);
            }}
            className="flex items-center gap-2.75 px-3 py-2 hover:bg-[#f5f0f0] rounded-lg text-[13px]"
          >
            <Image size={12} className="text-[#007BFC]" />
            <span>Add Photos</span>
          </button>

          {/* VIDEOS */}
          <button
            onClick={() => {
              setFileAccept("video/mp4,video/quicktime,video/x-m4v,video/*");
              fileRef.current?.click();
              setShowMenu(false);
            }}
            className="flex items-center gap-2.75 px-3 py-2 hover:bg-[#f5f0f0] rounded-lg text-[13px]"
          >
            <Video size={12} className="text-[#FF2E74]" />
            <span>Add Videos</span>
          </button>

          {/* FILES */}
          <button
            onClick={() => {
              setFileAccept(".pdf,.doc,.docx,.zip");
              fileRef.current?.click();
              setShowMenu(false);
            }}
            className="flex items-center gap-2.75 px-3 py-2 hover:bg-[#f5f0f0] rounded-lg text-[13px]"
          >
            <File size={12} className="text-[#333]" />
            <span>Files</span>
          </button>

          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2.75 px-3 py-2 hover:bg-[#f5f0f0] rounded-lg text-[13px]"
          >
            {" "}
            <Camera size={12} className="text-[#FF2E74]" />{" "}
            <span>Camera</span>{" "}
          </button>
        </div>
      )}

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
            className={`${
              showMenu ? "rotate-45" : "rotate-0"
            } transition-transform`}
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
          // onKeyDown={(e) => {
          //   if (e.key === "Enter" && !e.shiftKey) {
          //     e.preventDefault();
          //     handleSend();
          //   }
          // }}
          className="flex-1 bg-transparent text-sm focus:outline-none max-h-28 resize-none overflow-hidden leading-5 py-1"
        />

        {(isFocused || message) && (
          <button
            onClick={handleSend}
            disabled={!canSend || isSendingMedia}
            className="w-7.5 h-7.5 flex items-center justify-center bg-orange text-white rounded-full transition-all active:scale-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSendingMedia ? (
              <Loader2 size={18} strokeWidth={1} />
            ) : (
              <ArrowUp size={18} strokeWidth={1} />
            )}
          </button>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept={fileAccept}
        multiple
        className="hidden"
        onChange={handleImageUpload}
      />
    </div>
  );
};

export default SendMessage;

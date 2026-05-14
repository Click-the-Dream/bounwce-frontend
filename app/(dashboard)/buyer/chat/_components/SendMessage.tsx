"use client";

import { ArrowUp, Plus, Image, Camera } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { User } from "@/app/_utils/types/buyer";
import { websocket } from "@/app/services/websocket";
import useChat from "@/app/hooks/use-chat";
import MediaUploadModal from "./MediaUploadViewer";

interface ChatHeaderProps {
  selectedChat: User;
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

  const {
    transmitMessage,
    useGetChatImageSignature,
    useGetChatVideoSignature,
    useGetChatFileSignature,
    uploadToCloudinary,
    transmitImageMessage,
    transmitVideoMessage,
    transmitFileMessage,
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

    try {
      // TEXT ONLY
      if (message.trim() && pendingFiles.length === 0) {
        transmitMessage({
          recipient_id: selectedChat.id,
          body: message.trim(),
        });

        setMessage("");
        stopTyping();
        return;
      }

      // MEDIA
      for (const file of pendingFiles) {
        const isImage = file.type.startsWith("image/");
        const isVideo = file.type.startsWith("video/");
        const isFile = !isImage && !isVideo;

        const signature = isImage
          ? await imageSignature.mutateAsync()
          : isVideo
            ? await videoSignature.mutateAsync()
            : await fileSignature.mutateAsync();

        const uploaded = await uploadToCloudinary(file, signature);
        const url = uploaded.secure_url;

        const caption = message.trim();

        if (isImage) {
          await transmitImageMessage({
            recipient_id: selectedChat.id,
            image_url: url,
            caption,
          });
        } else if (isVideo) {
          await transmitVideoMessage({
            recipient_id: selectedChat.id,
            video_url: url,
            caption,
          });
        } else if (isFile) {
          await transmitFileMessage({
            recipient_id: selectedChat.id,
            file_url: url,
            caption,
          });
        }
      }

      setPendingFiles([]);
      setMessage("");
      stopTyping();
    } catch (err) {
      console.error(err);
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
        />
      )}

      {showMenu && (
        <div className="absolute bottom-16 left-3 md:left-6 w-48 bg-white rounded-xl shadow-lg border border-gray-100 p-1 flex flex-col gap-1 z-50">
          {/* IMAGES */}
          <button
            onClick={() => {
              setFileAccept("image/*");
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
              setFileAccept("video/*");
              fileRef.current?.click();
              setShowMenu(false);
            }}
            className="flex items-center gap-2.75 px-3 py-2 hover:bg-[#f5f0f0] rounded-lg text-[13px]"
          >
            <Camera size={12} className="text-[#FF2E74]" />
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
            <Plus size={12} className="text-[#333]" />
            <span>Files</span>
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

        <input
          value={message}
          onChange={(e) => handleTyping(e.target.value)}
          type="text"
          placeholder="Message"
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            stopTyping();
          }}
          className="flex-1 bg-transparent text-sm focus:outline-none"
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />

        {(isFocused || message) && (
          <button
            onClick={handleSend}
            className="w-7.5 h-7.5 flex items-center justify-center bg-orange text-white rounded-full transition-all active:scale-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowUp size={18} strokeWidth={1} />
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

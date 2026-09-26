"use client";

import {
  FileImage,
  FileVideo2,
  Globe2,
  ImagePlus,
  Smile,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { CreateFeedPostInput, FeedUser } from "./types";
import UserImage from "../../_components/UserImage";

const EMOJIS = ["🙂", "😂", "🔥", "❤️", "👏", "👀", "🙌", "✨"];

type FeedComposerProps = {
  user: FeedUser;
  onSubmit: (input: CreateFeedPostInput) => void;
  onNotice?: (message: string) => void;
  autoFocus?: boolean;
};

export default function FeedComposer({
  user,
  onSubmit,
  onNotice,
  autoFocus,
}: FeedComposerProps) {
  const [text, setText] = useState("");
  const [media, setMedia] = useState<string[]>([]);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canPost = Boolean(text.trim() || media.length);

  const appendFiles = (files: FileList | File[]) => {
    const imageFiles = Array.from(files).filter((file) =>
      file.type.startsWith("image/"),
    );

    if (!imageFiles.length) {
      onNotice?.("Only image files can be attached in the temporary feed.");
      return;
    }

    const remaining = Math.max(0, 4 - media.length);
    if (imageFiles.length > remaining) {
      onNotice?.("You can attach up to 4 images per post.");
    }

    imageFiles.slice(0, remaining).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setMedia((current) => {
          if (current.length >= 4) return current;
          return [...current, String(reader.result)];
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = () => {
    if (!canPost) return;
    onSubmit({ text: text.trim(), media });
    setText("");
    setMedia([]);
    setEmojiOpen(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    appendFiles(event.dataTransfer.files);
  };

  return (
    <section
      className={`relative rounded-none px-4 pb-3 pt-4 sm:pb-5 ${
        dragActive ? "ring-2 ring-orange" : ""
      }`}
      onDragOver={(event) => {
        event.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
    >
      <div className="flex items-start gap-4 sm:gap-5">
        <UserImage
          user={{
            id: user.id,
            full_name: user.fullName,
            profile_pic: {
              url: user.avatar,
            },
          }}
          size={32}
          rounded="rounded-[10px] bg-gray-100 border-[#d6d6d6]"
          clickable={false}
        />

        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() =>
              onNotice?.(
                "Reply visibility is set to everyone for this temporary build.",
              )
            }
            className="mb-4 inline-flex items-center gap-2.5 rounded-full border-[0.53px] border-[#00000033] px-2.5 py-0.5 text-xs font-medium text-[#9C9C9C] transition hover:border-[#9C9C9C]/30 hover:bg-[#9C9C9C]/5"
          >
            <Globe2 className="h-4 w-4" strokeWidth={1.6} />
            Everyone can reply
          </button>

          <textarea
            ref={textareaRef}
            autoFocus={autoFocus}
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                event.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="What’s bowncing?"
            aria-label="Create a new post"
            rows={3}
            className="min-h-17.5 w-full resize-none bg-transparent text-[13px] text-[#767676] leading-7 outline-none"
          />

          {media.length > 0 && (
            <div className="mb-3 grid grid-cols-2 gap-2">
              {media.map((src, index) => (
                <div
                  key={`${src.slice(-24)}-${index}`}
                  className="relative overflow-hidden rounded-[14px] border border-white/10"
                >
                  <img
                    src={src}
                    alt=""
                    className="aspect-video h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setMedia((current) =>
                        current.filter((_, i) => i !== index),
                      )
                    }
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/65 text-white backdrop-blur"
                    aria-label={`Remove image ${index + 1}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between gap-4 pt-1">
            <div className="flex items-center gap-3 text-orange">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex h-9 w-9 items-center justify-center rounded-lg transition hover:bg-white/5"
                aria-label="Add image"
              >
                <ImagePlus className="h-4.25 w-4.25" strokeWidth={1.8} />
              </button>
              <button
                type="button"
                onClick={() => {
                  inputRef.current?.click();
                  onNotice?.(
                    "Choose images from your device. GIF upload will use the same media endpoint later.",
                  );
                }}
                className="flex h-9 w-9 items-center justify-center rounded-lg transition hover:bg-white/5"
                aria-label="Add media"
              >
                <FileVideo2 className="h-4.25 w-4.25" strokeWidth={1.8} />
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setEmojiOpen((open) => !open)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg transition hover:bg-white/5"
                  aria-label="Add emoji"
                  aria-expanded={emojiOpen}
                >
                  <Smile className="h-4.25 w-4.25" strokeWidth={1.8} />
                </button>
                {emojiOpen && (
                  <div className="absolute bottom-11 left-0 z-30 flex w-55 flex-wrap gap-1 rounded-2xl border border-black/10 bg-white p-2 shadow-[0_12px_28px_rgba(0,0,0,0.3)]">
                    {EMOJIS.map((emoji) => (
                      <button
                        type="button"
                        key={emoji}
                        onClick={() => {
                          setText(
                            (current) =>
                              `${current}${current ? " " : ""}${emoji}`,
                          );
                          textareaRef.current?.focus();
                        }}
                        className="h-10 w-10 rounded-xl text-xl transition hover:bg-black/5"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canPost}
              className="cursor-pointer rounded-full bg-black px-4 py-1.5 text-[13px] text-white transition disabled:cursor-not-allowed disabled:bg-[#bababa] disabled:text-white/90"
            >
              Post
            </button>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(event) => {
              if (event.target.files) appendFiles(event.target.files);
              event.currentTarget.value = "";
            }}
          />
        </div>
      </div>
    </section>
  );
}

export function ComposerIcon({ kind }: { kind: "image" | "gif" | "emoji" }) {
  if (kind === "image") return <FileImage className="h-5 w-5" />;
  if (kind === "gif") return <FileVideo2 className="h-5 w-5" />;
  return <Smile className="h-5 w-5" />;
}

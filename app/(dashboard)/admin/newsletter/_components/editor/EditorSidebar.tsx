"use client";

import ReactQuill, { Quill } from "react-quill-new";
import ImageResize from "@mgreminger/quill-image-resize-module";
import "react-quill-new/dist/quill.snow.css";
import "./editor.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useChat from "@/app/hooks/use-chat";
import { onFailure } from "@/app/_utils/notification";

Quill.register("modules/imageResize", ImageResize);

type EditorSidebarProps = {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  previewMode: "mobile" | "desktop";
};

const EditorSidebar = ({
  formData,
  setFormData,
  previewMode,
}: EditorSidebarProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const { useGetChatSignature, uploadToCloudinary } = useChat();
  const { mutateAsync: getSignature } = useGetChatSignature();

  // Prevent multiple Cloudinary uploads from being triggered at once.
  const imageUploadInProgress = useRef(false);

  // ESC to exit fullscreen
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsFullscreen(false);
      }
    };

    window.addEventListener("keydown", handler);

    return () => {
      window.removeEventListener("keydown", handler);
    };
  }, []);

  /**
   * Upload through the same signed Cloudinary flow used by event banners,
   * then insert the secure URL into the active Quill editor.
   */
  const handleImageUpload = useCallback(async function (this: { quill: any }) {
    if (imageUploadInProgress.current) return;

    const quill = this.quill;
    if (!quill) {
      onFailure({
        title: "Image Upload Failed",
        message: "The newsletter editor is not ready. Please try again.",
      });
      return;
    }

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        onFailure({
          title: "Unsupported File",
          message: "Choose an image file to insert into the newsletter.",
        });
        return;
      }

      try {
        imageUploadInProgress.current = true;
        setIsUploadingImage(true);

        // Keep the signature request and Cloudinary upload identical to
        // the working event-banner upload flow.
        const signature = await getSignature({ upload_type: "image", count: 1 });
        if (!signature?.fields) {
          throw new Error("The image upload signature was not returned.");
        }

        const uploaded = await uploadToCloudinary(file, signature);
        const imageUrl = uploaded?.secure_url;
        if (!imageUrl) {
          throw new Error("Cloudinary did not return a secure image URL.");
        }

        const range = quill.getSelection(true) || {
          index: quill.getLength(),
          length: 0,
        };

        quill.insertEmbed(range.index, "image", imageUrl, "user");
        quill.setSelection(range.index + 1, 0, "user");
      } catch (error) {
        console.error("[NEWSLETTER] Image upload failed:", error);
        let message =
          error instanceof Error ? error.message : "Please try uploading the image again.";

        // Cloudinary may return a JSON string as the error body.
        try {
          const parsed = JSON.parse(message.replace(/^Cloudinary upload failed:\s*/, ""));
          message = parsed?.error?.message || message;
        } catch {
          // Keep the original message when it is not JSON.
        }

        if (/upload preset not found/i.test(message)) {
          message =
            "Cloudinary rejected the upload preset returned by the server. Check the Cloudinary upload configuration and try again.";
        }

        onFailure({ title: "Newsletter Image Upload Failed", message });
      } finally {
        imageUploadInProgress.current = false;
        setIsUploadingImage(false);
      }
    };

    input.click();
  }, [getSignature, uploadToCloudinary]);

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ align: [] }],
          [{ list: "ordered" }, { list: "bullet" }],
          ["link", "image"],
          ["clean"],
        ],

        handlers: {
          image: handleImageUpload,
        },
      },

      // Enables click-to-select + drag-to-resize images.
      imageResize: {
        modules: ["Resize", "DisplaySize", "AltText"],
      },
    }),
    [handleImageUpload],
  );

  if (previewMode === "mobile") {
    return null;
  }

  return (
    <>
      {/* FULLSCREEN EDITOR */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
            <span className="text-xs font-black uppercase text-stone-500">
              Focus Mode
            </span>

            <div className="flex items-center gap-4">
              {isUploadingImage && (
                <span className="text-xs font-medium text-orange-600">
                  Uploading image...
                </span>
              )}

              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="text-xs font-bold text-stone-600 hover:text-black"
              >
                Close ✕
              </button>
            </div>
          </div>

          <div className="flex-1 p-6 overflow-hidden">
            <ReactQuill
              theme="snow"
              value={formData.content}
              onChange={(value) =>
                setFormData((prev: any) => ({
                  ...prev,
                  content: value,
                }))
              }
              className="h-full"
              modules={modules}
            />
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <aside className="w-full md:max-w-112.5 bg-white border-r border-stone-100 overflow-y-auto p-8 md:p-12 space-y-10">
        <div className="space-y-8">
          {/* DESCRIPTION */}
          <div>
            <label className="text-[10px] font-black text-stone-500 uppercase mb-3 block">
              Campaign Description
            </label>

            <input
              className="w-full border-b border-stone-100 py-2 outline-none text-sm italic"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev: any) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
            />
          </div>

          {/* SUBJECT */}
          <div>
            <label className="text-[10px] font-black text-stone-500 uppercase mb-3 block">
              Public Subject Line
            </label>

            <input
              className="w-full border-b-2 border-stone-100 py-4 outline-none font-bold text-xl"
              value={formData.subject}
              onChange={(e) =>
                setFormData((prev: any) => ({
                  ...prev,
                  subject: e.target.value,
                }))
              }
            />
          </div>

          {/* CONTENT EDITOR */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-[10px] font-black text-stone-500 uppercase">
                Message Content
              </label>

              <div className="flex items-center gap-4">
                {isUploadingImage && (
                  <span className="text-[10px] font-bold text-orange-600">
                    Uploading image...
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => setIsFullscreen(true)}
                  className="text-[10px] font-bold text-stone-500 hover:text-stone-900"
                >
                  Focus Mode
                </button>
              </div>
            </div>

            <div className="bg-stone-50 rounded-2xl overflow-hidden">
              <ReactQuill
                theme="snow"
                value={formData.content}
                onChange={(value) =>
                  setFormData((prev: any) => ({
                    ...prev,
                    content: value,
                  }))
                }
                modules={modules}
                className="min-h-[40vh]"
              />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default EditorSidebar;

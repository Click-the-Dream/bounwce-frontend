"use client";

import ReactQuill, { Quill } from "react-quill-new";
import ImageResize from "@mgreminger/quill-image-resize-module";
import "react-quill-new/dist/quill.snow.css";
import "./editor.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import api from "@/app/services/api";

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
   * Upload an image to Cloudinary and insert the resulting
   * secure URL into the active Quill editor.
   */
  const handleImageUpload = useCallback(async function (this: { quill: any }) {
    if (imageUploadInProgress.current) {
      return;
    }

    const quill = this.quill;

    if (!quill) {
      console.error("Quill editor instance was not found.");
      return;
    }

    const input = document.createElement("input");

    input.type = "file";
    input.accept = "image/*";

    input.onchange = async () => {
      const file = input.files?.[0];

      if (!file) {
        return;
      }

      // Basic validation
      if (!file.type.startsWith("image/")) {
        console.error("Selected file is not an image.");
        return;
      }

      try {
        imageUploadInProgress.current = true;
        setIsUploadingImage(true);

        /**
         * Step 1:
         * Ask backend for the signed Cloudinary upload details.
         *
         * This is the same endpoint already used elsewhere
         * in your application.
         */
        const signatureResponse = await api.post("/uploads/chat/sign", {
          upload_type: "image",
          count: 1,
        });

        const signature = signatureResponse.data?.data;

        if (!signature?.fields) {
          throw new Error("Cloudinary upload signature was not returned.");
        }

        /**
         * Step 2:
         * Upload directly to Cloudinary.
         */
        const uploadForm = new FormData();

        uploadForm.append("file", file);
        uploadForm.append("api_key", signature.fields.api_key);
        uploadForm.append("timestamp", String(signature.fields.timestamp));
        uploadForm.append("signature", signature.fields.signature);
        uploadForm.append("upload_preset", signature.fields.upload_preset);

        if (signature.fields.folder) {
          uploadForm.append("folder", signature.fields.folder);
        }

        if (signature.fields.public_id) {
          uploadForm.append("public_id", signature.fields.public_id);
        }

        const resourceType = signature.constraints?.resource_type || "image";

        const cloudinaryResponse = await fetch(
          `https://api.cloudinary.com/v1_1/${signature.fields.cloud_name}/${resourceType}/upload`,
          {
            method: "POST",
            body: uploadForm,
          },
        );

        if (!cloudinaryResponse.ok) {
          const errorText = await cloudinaryResponse.text();

          throw new Error(`Cloudinary upload failed: ${errorText}`);
        }

        const uploaded = await cloudinaryResponse.json();

        const imageUrl = uploaded?.secure_url;

        if (!imageUrl) {
          throw new Error("Cloudinary did not return a secure URL.");
        }

        /*Put the HTTPS Cloudinary URL into Quill.
         *
         * Quill will store:
         * <img src="https://res.cloudinary.com/...">
         * instead of:
         * <img src="data:image/...">
         */
        const range = quill.getSelection(true) || {
          index: quill.getLength(),
          length: 0,
        };

        quill.insertEmbed(range.index, "image", imageUrl, "user");

        quill.setSelection(range.index + 1, 0, "user");

        console.log("[NEWSLETTER] Image uploaded:", imageUrl);
      } catch (error) {
        console.error("[NEWSLETTER] Image upload failed:", error);
      } finally {
        imageUploadInProgress.current = false;
        setIsUploadingImage(false);
      }
    };

    input.click();
  }, []);

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

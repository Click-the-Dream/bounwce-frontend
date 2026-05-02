"use client";

import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import "./editor.css";
import { useEffect, useState } from "react";

const EditorSidebar = ({ formData, setFormData, previewMode }: any) => {
  if (previewMode === "mobile") return null;

  const [isFullscreen, setIsFullscreen] = useState(false);

  // ESC to exit fullscreen
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFullscreen(false);
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          {/* HEADER BAR */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
            <span className="text-xs font-black uppercase text-stone-500">
              Focus Mode
            </span>

            <button
              onClick={() => setIsFullscreen(false)}
              className="text-xs font-bold text-stone-600 hover:text-black"
            >
              Close ✕
            </button>
          </div>

          {/* EDITOR */}
          <div className="flex-1 p-6 overflow-hidden">
            <ReactQuill
              theme="snow"
              value={formData.content}
              onChange={(value) => setFormData({ ...formData, content: value })}
              className="h-full"
            />
          </div>
        </div>
      )}

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
                setFormData({ ...formData, description: e.target.value })
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
                setFormData({ ...formData, subject: e.target.value })
              }
            />
          </div>

          {/* CONTENT EDITOR */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-[10px] font-black text-stone-500 uppercase">
                Message Content
              </label>

              <button
                onClick={() => setIsFullscreen(true)}
                className="text-[10px] font-bold text-stone-500 hover:text-stone-900"
              >
                Focus Mode
              </button>
            </div>

            <div className="bg-stone-50 rounded-2xl overflow-hidden">
              <ReactQuill
                theme="snow"
                value={formData.content}
                onChange={(value) =>
                  setFormData({ ...formData, content: value })
                }
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

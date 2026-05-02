import { Monitor, Smartphone } from "lucide-react";

type PreviewMode = "mobile" | "desktop";

interface Props {
  previewMode: PreviewMode;
  setPreviewMode: (mode: PreviewMode) => void;
}

const PreviewToggle = ({ previewMode, setPreviewMode }: Props) => {
  return (
    <div className="flex bg-stone-100 p-1 rounded-full shrink-0">
      {/* DESKTOP / EDIT */}
      <button
        onClick={() => setPreviewMode("desktop")}
        className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase transition-all duration-200
        ${
          previewMode === "desktop"
            ? "bg-white shadow-sm text-stone-900"
            : "text-stone-400 hover:text-stone-700"
        }`}
      >
        <Monitor size={14} />
        <span className="hidden sm:inline">Edit</span>
      </button>

      {/* MOBILE / PREVIEW */}
      <button
        onClick={() => setPreviewMode("mobile")}
        className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase transition-all duration-200
        ${
          previewMode === "mobile"
            ? "bg-white shadow-sm text-stone-900"
            : "text-stone-400 hover:text-stone-700"
        }`}
      >
        <Smartphone size={14} />
        <span className="hidden sm:inline">Preview</span>
      </button>
    </div>
  );
};

export default PreviewToggle;

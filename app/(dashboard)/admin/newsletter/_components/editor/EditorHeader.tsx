import {
  ChevronLeft,
  Loader2,
  Monitor,
  Save,
  Send,
  Smartphone,
} from "lucide-react";

const EditorHeader = ({
  setIsEditorOpen,
  formData,
  setFormData,
  previewMode,
  setPreviewMode,
  isSaving,
  isBroadcasting,
  handleSaveDraft,
  setShowFinalCheck,
}: any) => {
  return (
    <header className="h-auto min-h-20 border-b border-stone-100 flex flex-wrap items-center justify-between px-4 md:px-10 py-4 gap-4 shrink-0">
      <div className="flex items-center gap-4 flex-1 min-w-60">
        <button
          onClick={() => setIsEditorOpen(false)}
          className="text-stone-400 hover:text-stone-900 flex items-center gap-2 font-bold text-xs uppercase"
        >
          <ChevronLeft size={20} /> Exit
        </button>

        <input
          className="text-lg font-bold focus:outline-none w-full max-w-50 md:max-w-xs"
          placeholder="Campaign Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>

      <div className="flex items-center gap-2 md:gap-4 ml-auto">
        <div className="flex bg-stone-100 p-1 rounded-full">
          <button
            onClick={() => setPreviewMode("desktop")}
            className={`p-2 px-3 md:px-6 rounded-full text-[10px] font-black uppercase flex items-center gap-2 ${
              previewMode === "desktop"
                ? "bg-white shadow-sm text-stone-900"
                : "text-stone-400"
            }`}
          >
            <Monitor size={14} /> Edit
          </button>

          <button
            onClick={() => setPreviewMode("mobile")}
            className={`p-2 px-3 md:px-6 rounded-full text-[10px] font-black uppercase flex items-center gap-2 ${
              previewMode === "mobile"
                ? "bg-white shadow-sm text-stone-900"
                : "text-stone-400"
            }`}
          >
            <Smartphone size={14} /> Preview
          </button>
        </div>

        <button
          onClick={handleSaveDraft}
          disabled={isSaving}
          className="bg-stone-100 text-stone-600 p-3 md:px-5 md:py-3 rounded-full font-bold text-xs uppercase flex items-center gap-2"
        >
          {isSaving ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Save size={14} />
          )}
        </button>

        <button
          onClick={() => setShowFinalCheck(true)}
          disabled={isSaving || isBroadcasting}
          className="bg-[#ff3b0a] text-white p-3 md:px-6 md:py-3 rounded-full font-bold text-xs uppercase flex items-center gap-2"
        >
          <Send size={14} /> Broadcast
        </button>
      </div>
    </header>
  );
};

export default EditorHeader;

import React from "react";
import { Eye, Loader2 } from "lucide-react";

interface FormActionsProps {
  isLoading: boolean;
  onPreview?: () => void;
  onSaveDraft?: () => void;
}

export const FormActions: React.FC<FormActionsProps> = ({
  isLoading,
  onPreview,
  onSaveDraft,
}) => (
  <div className="pt-4 flex flex-wrap gap-1 items-center justify-between border-t border-gray-50">
    <button
      type="button"
      onClick={onPreview}
      className="flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200/80 px-4 py-2.5 rounded-[10px] transition"
    >
      <Eye size={14} />
      Preview
    </button>

    <div className="flex items-center gap-3 ml-auto">
      <button
        type="button"
        onClick={onSaveDraft}
        className="text-xs font-medium text-black bg-white border-[0.83px] border-black rounded-[10px] px-5 py-2.5 hover:bg-gray-50 transition"
      >
        Save as Draft
      </button>
      <button
        type="submit"
        disabled={isLoading}
        className={`rounded-[10px] border border-black px-5 py-2.5 text-xs font-medium text-white flex items-center justify-center gap-2 shadow-[inset_0_-4px_4px_0_rgba(0,0,0,0.25),inset_0_4px_4px_0_rgba(0,0,0,0.25),inset_-7px_0_4.4px_0_rgba(0,0,0,0.12),inset_7px_0_4px_-3px_rgba(0,0,0,0.25)] transition-all duration-200 active:translate-y-px ${
          isLoading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-orange hover:bg-[#e03e43]"
        }`}
      >
        {isLoading ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Creating...
          </>
        ) : (
          "Create Event"
        )}
      </button>
    </div>
  </div>
);

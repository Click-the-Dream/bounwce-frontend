"use client";

import { useState } from "react";
import useNewsletter from "@/app/hooks/useNewsletter";
import { Trash2, Loader2, Calendar, FileText, Send } from "lucide-react";
import DeleteConfirmModal from "./DeleteConfirmModal"; // Import the new modal

const NewsLetterCard = ({ data, handleOpenEditor }: any) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { deleteNewsletter } = useNewsletter();

  const isDeleting =
    deleteNewsletter.isPending && deleteNewsletter.variables === data.id;

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsModalOpen(true);
  };

  const confirmDelete = () => {
    deleteNewsletter.mutate(data.id, {
      onSuccess: () => setIsModalOpen(false),
    });
  };

  return (
    <>
      <div
        onClick={() => handleOpenEditor(data)}
        className={`
          group relative flex flex-col h-full bg-white border border-stone-200 rounded-2xl 
          p-6 transition-all duration-300 hover:shadow-xl hover:border-stone-300 hover:-translate-y-1 cursor-pointer
          ${isDeleting ? "opacity-50 grayscale pointer-events-none" : ""}
        `}
      >
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-2">
            {data.is_sent ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-50 text-green-700 border border-green-100">
                <Send size={12} />
                <span className="text-[11px] font-bold uppercase">Sent</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-100">
                <FileText size={12} />
                <span className="text-[11px] font-bold uppercase">Draft</span>
              </div>
            )}
          </div>

          <button
            className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            onClick={handleDeleteClick}
          >
            <Trash2 size={16} />
          </button>
        </div>

        <div className="flex-1">
          <h3 className="font-bold text-xl text-stone-900 leading-snug mb-2 group-hover:text-[#ff3b0a] transition-colors line-clamp-2">
            {data.subject || "Untitled Campaign"}
          </h3>
          <p className="text-stone-500 text-sm line-clamp-2 mb-4 leading-relaxed">
            {data.description || "No description provided."}
          </p>
        </div>

        <div className="pt-5 mt-auto border-t border-stone-100 flex justify-between items-center text-stone-400">
          <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider">
            <Calendar size={14} />
            {data.created_at
              ? new Date(data.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              : "Recently"}
          </div>
        </div>
      </div>

      <DeleteConfirmModal
        isOpen={isModalOpen}
        isDeleting={isDeleting}
        title={data.name || data.subject}
        onClose={() => setIsModalOpen(false)}
        onConfirm={confirmDelete}
      />
    </>
  );
};

export default NewsLetterCard;

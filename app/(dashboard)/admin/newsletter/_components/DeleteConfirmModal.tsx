"use client";

import { AlertTriangle, Loader2 } from "lucide-react";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  isDeleting: boolean;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  isDeleting,
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-110 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative bg-white w-full max-w-sm rounded-4xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle size={32} />
          </div>

          <h3 className="text-2xl font-bold text-stone-900 mb-2">
            Delete Campaign?
          </h3>
          <p className="text-stone-500 text-sm leading-relaxed mb-8">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-stone-900">"{title}"</span>?
            This action is permanent and cannot be undone.
          </p>

          <div className="flex flex-col w-full gap-3">
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-[10px] font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isDeleting ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                "Delete Permanently"
              )}
            </button>

            <button
              onClick={onClose}
              disabled={isDeleting}
              className="w-full bg-stone-100 hover:bg-stone-200 text-stone-600 py-2 rounded-[10px] font-medium transition-all"
            >
              Keep Campaign
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

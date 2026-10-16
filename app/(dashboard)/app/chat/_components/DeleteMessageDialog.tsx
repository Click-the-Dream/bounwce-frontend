"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";

interface DeleteMessageDialogProps {
  open: boolean;
  scope?: "conversation" | "group";
  preview?: string | null;
  onCancel: () => void;
  /** Return false to keep the dialog open (for example, when offline). */
  onConfirm: () => boolean | void;
}

/** Bouwnce-styled confirmation dialog shared by direct and group messages. */
export default function DeleteMessageDialog({
  open,
  scope = "conversation",
  preview,
  onCancel,
  onConfirm,
}: DeleteMessageDialogProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;

  useEffect(() => {
    if (!open) return;
    confirmButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancelRef.current();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  if (!open) return null;

  const target = scope === "group" ? "everyone in this group" : "everyone in this chat";
  const normalizedPreview = preview?.trim();
  const confirm = () => {
    const accepted = onConfirm();
    if (accepted !== false) onCancel();
  };

  return (
    <div
      className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-950/40 px-4 py-6 backdrop-blur-[3px]"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-message-title"
        aria-describedby="delete-message-description"
        className="w-full max-w-[420px] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.24)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-3 p-5 sm:p-6">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600 ring-1 ring-inset ring-red-100">
            <AlertTriangle size={21} strokeWidth={2.1} />
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <h2 id="delete-message-title" className="text-base font-semibold tracking-tight text-gray-900">
              Delete this message?
            </h2>
            <p id="delete-message-description" className="mt-1.5 text-sm leading-5 text-gray-500">
              This message will be permanently deleted for {target}. This action can’t be undone.
            </p>
            {normalizedPreview && (
              <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5">
                <p className="line-clamp-3 break-words text-xs leading-5 text-gray-600">{normalizedPreview}</p>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close delete confirmation"
            className="-mr-1 -mt-1 rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
          >
            <X size={17} />
          </button>
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-gray-100 bg-gray-50/80 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
          >
            Cancel
          </button>
          <button
            type="button"
            ref={confirmButtonRef}
            onClick={confirm}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
          >
            <Trash2 size={15} />
            Delete message
          </button>
        </div>
      </section>
    </div>
  );
}

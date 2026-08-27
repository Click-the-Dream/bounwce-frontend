"use client";

import React, { useState } from "react";
import { ChevronLeft, Ticket, Scan, X } from "lucide-react";
import { ScannerIcon, TicketIcon } from "@/app/_utils/CustomIcons";

type TicketVerificationMode = "page" | "modal";

interface TicketVerificationProps {
  onConfirm?: (ticketRef: string) => void;
  onCancel?: () => void;
  mode?: TicketVerificationMode;
}

export default function TicketVerification({
  onConfirm,
  onCancel,
  mode = "page",
}: TicketVerificationProps) {
  const [ticketRef, setTicketRef] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = ticketRef.trim();

    if (!value) return;
    onConfirm?.(value);
  };

  const isModal = mode === "modal";

  return (
    <div
      className={
        isModal
          ? "w-full max-w-135 rounded-4xl border border-black/20 bg-white p-8 pt-0 font-sans shadow-2xl h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          : "w-full max-w-135 rounded-4xl border border-black/20 bg-white p-8 pt-0 font-sans shadow-sm"
      }
    >
      <div className="sticky top-0 pt-8 bg-inherit flex items-center gap-4 border-b border-gray-100 pb-4.25">
        <button
          onClick={onCancel}
          type="button"
          aria-label={isModal ? "Close ticket verification" : "Go back"}
          style={{
            backdropFilter: "blur(20.59200096130371px)",
          }}
          className="flex h-8.25 w-8.25 items-center justify-center rounded-full border-[0.5px] border-[#00000033] text-gray-700 transition-colors hover:bg-gray-50"
        >
          {isModal ? (
            <X className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>

        <div>
          <h1 className="text-[13px] font-medium leading-tight text-black">
            Ticket Verification
          </h1>
          <p className="text-xs text-gray-500">
            Verify attendee entry for this event
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col items-center py-8 text-center"
      >
        <div className="mb-4.5 flex h-14.5 w-15 items-center justify-center rounded-full bg-[#D9D9D9] text-black/25">
          <TicketIcon />
        </div>

        <h2 className="text-black text-sm font-medium mb-1">Verify Ticket</h2>

        <p className="mb-8 max-w-90 text-[13px] leading-tight text-[#6D6D6D]">
          Enter the ticket reference number below to confirm an attendee's
          entry, or scan their QR code.
        </p>

        <div className="mb-6 w-full text-left">
          <label
            htmlFor="ticketRef"
            className="mb-2 block text-sm font-medium text-black"
          >
            Ticket Reference number
          </label>

          <input
            id="ticketRef"
            name="ticketRef"
            type="text"
            autoComplete="off"
            value={ticketRef}
            onChange={(e) => setTicketRef(e.target.value)}
            placeholder="e.g... TKT   585   49JD"
            className="w-full rounded-[10px] border-[0.53px] border-black/20 px-4 py-3 text-black transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-black placeholder:text-black/20"
          />

          <p className="mt-2 text-xs text-gray-400">
            The ticket ID can be found on the attendee's confirmation email.
          </p>
        </div>

        <div className="mb-14 mt-2 flex flex-col items-center">
          <button
            type="button"
            className="mb-2.5 flex h-20 w-21.5 items-center justify-center rounded-2xl bg-[#F1F1F1] text-gray-700 transition-colors hover:bg-gray-200"
          >
            <ScannerIcon />
          </button>
          <span className="text-xs font-medium text-black">Scan QR Code</span>
        </div>

        <div className="w-full space-y-3 pt-2">
          <button
            type="submit"
            disabled={!ticketRef.trim()}
            className="w-full rounded-[10px] bg-black px-4 py-3 font-medium text-[13px] text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Confirm Ticket
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="w-full rounded-[10px] border border-gray-200 bg-white px-4 py-3 font-medium text-[13px] text-black transition-colors hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

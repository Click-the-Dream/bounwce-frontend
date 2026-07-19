"use client";

import React, { useState } from "react";
import { X, Trash2, Info } from "lucide-react";
import { TICKET_TYPES } from "@/app/_utils/utility";
import CancelTicketIcon from "@/app/_utils/CustomIcons";

interface TicketPricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTickets: string[];
  ticketPrices: { ticket_name: string; price: string }[];
  toggleTicketType: (type: string) => void;
  setTicketPrices: React.Dispatch<
    React.SetStateAction<{ ticket_name: string; price: string }[]>
  >;
  setSelectedTickets: React.Dispatch<React.SetStateAction<string[]>>;
}

function TicketPricingModal({
  isOpen,
  onClose,
  selectedTickets,
  ticketPrices,
  toggleTicketType,
  setTicketPrices,
  setSelectedTickets,
}: TicketPricingModalProps) {
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const removeTicketRow = (type: string) => {
    setSelectedTickets(selectedTickets.filter((t) => t !== type));
    setTicketPrices(ticketPrices.filter((item) => item.ticket_name !== type));
    setError(null);
  };

  const handlePriceChange = (index: number, value: string) => {
    const numericValue = value.replace(/\D/g, "");

    const updated = [...ticketPrices];
    updated[index].price = numericValue;
    setTicketPrices(updated);
    if (error) setError(null);
  };

  const handleTypeChange = (index: number, value: string) => {
    const updated = [...ticketPrices];
    const oldType = updated[index].ticket_name;
    updated[index].ticket_name = value;
    setTicketPrices(updated);

    // Keep the selectedTickets tracking array in sync
    setSelectedTickets(selectedTickets.map((t) => (t === oldType ? value : t)));
    if (error) setError(null);
  };

  const addNewCustomCategory = () => {
    // Generate a default temporary name for the new custom row
    const customTypeNumber =
      ticketPrices.filter((t) => t.ticket_name.startsWith("Custom Category"))
        .length + 1;
    const newType = `Custom Category ${customTypeNumber}`;

    setSelectedTickets([...selectedTickets, newType]);
    setTicketPrices([...ticketPrices, { ticket_name: newType, price: "" }]);
    setError(null);
  };

  // Intercept the close action to validate prices first
  const handleCloseAttempt = () => {
    const hasEmptyPrices = ticketPrices.some((ticket) => !ticket.price.trim());
    const hasEmptyNames = ticketPrices.some(
      (ticket) => !ticket.ticket_name.trim(),
    );

    if (hasEmptyPrices) {
      setError("Please provide a price for all selected tickets.");
      return;
    }

    if (hasEmptyNames) {
      setError("Please ensure all custom categories have names.");
      return;
    }

    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
      {/* Modal Card Box */}
      <div className="w-full max-w-135 bg-white rounded-2xl border border-orange-500/20 p-5 shadow-xl relative transition-all">
        {/* Header Block */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCloseAttempt}
              className="hover:scale-105 transition-transform"
            >
              <CancelTicketIcon />
            </button>
            <span className="text-sm font-bold text-gray-900 tracking-tight">
              Ticket Pricing <span className="text-[#FF474D]">*</span>
            </span>
          </div>
          <Info size={15} className="text-gray-400 cursor-pointer" />
        </div>

        {/* Quick Add Section */}
        <div className="flex flex-wrap items-center gap-1.5 mb-4">
          <span className="text-[11px] text-gray-400 font-medium mr-1.5">
            Quick add
          </span>
          {TICKET_TYPES.map((type) => {
            const isSelected = selectedTickets.includes(type);
            return (
              <button
                key={type}
                type="button"
                onClick={() => {
                  toggleTicketType(type);
                  setError(null);
                }}
                className={`text-[11px] px-2.75 py-1 rounded-[20px] border transition flex items-center gap-1 font-medium ${
                  isSelected
                    ? "bg-orange-50/40 border-[#FF474D] text-[#FF474D]"
                    : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                <span
                  className={isSelected ? "text-[#FF474D]" : "text-gray-400"}
                >
                  +
                </span>
                {type}
              </button>
            );
          })}
        </div>

        {/* Gray Dynamic Input Area */}
        <div className="bg-gray-50/50 rounded-2xl border border-gray-100 p-4 mb-4">
          {/* Section Column Sub-labels */}
          <div className="grid grid-cols-[1fr_1fr_24px] gap-4 mb-2 px-0.5">
            <span className="text-xs font-bold text-gray-800">Ticket</span>
            <span className="text-xs font-bold text-gray-800">Price</span>
            <div></div>
          </div>

          {/* Table Input Rows */}
          <div className="space-y-2.5">
            {ticketPrices.map((ticket, index) => {
              const isCustom =
                !TICKET_TYPES.includes(ticket.ticket_name) &&
                !ticket.ticket_name.startsWith("Custom Category");
              const isDefaultCustom =
                ticket.ticket_name.startsWith("Custom Category");
              const editableType = isCustom || isDefaultCustom;

              return (
                <div
                  key={ticket.ticket_name}
                  className="grid grid-cols-[1fr_1fr_24px] gap-4 items-center"
                >
                  <input
                    type="text"
                    value={ticket.ticket_name}
                    readOnly={!editableType}
                    onChange={(e) => handleTypeChange(index, e.target.value)}
                    placeholder="Category name"
                    className={`w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 outline-none select-none ${
                      editableType ? "focus:border-gray-300" : ""
                    }`}
                  />

                  <input
                    type="text"
                    value={ticket.price}
                    onChange={(e) => handlePriceChange(index, e.target.value)}
                    placeholder="Enter price"
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-800 placeholder-gray-300 focus:outline-none focus:border-gray-300 transition"
                  />

                  <button
                    type="button"
                    onClick={() => removeTicketRow(ticket.ticket_name)}
                    className="text-gray-300 hover:text-gray-500 transition flex justify-center"
                  >
                    <Trash2 size={15} strokeWidth={1.5} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Error message block */}
        {error && (
          <p className="text-xs text-[#FF474D] font-medium mb-4 animate-pulse">
            {error}
          </p>
        )}

        {/* Bottom Add Trigger Style Button */}
        <button
          type="button"
          onClick={addNewCustomCategory}
          className="border border-dashed border-[#FF474D] text-[#FF474D] font-bold rounded-lg px-4 py-2 text-xs hover:bg-red-50/30 transition"
        >
          + Add Category
        </button>
      </div>
    </div>
  );
}

export default TicketPricingModal;

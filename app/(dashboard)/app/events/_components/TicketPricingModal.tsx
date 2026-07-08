"use client";

import React, { useState } from "react";
import { X, Trash2, Info } from "lucide-react";
import { TICKET_TYPES } from "@/app/_utils/utility";
interface TicketPricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTickets: string[];
  ticketPrices: { type: string; price: string }[];
  toggleTicketType: (type: string) => void;
  setTicketPrices: React.Dispatch<
    React.SetStateAction<{ type: string; price: string }[]>
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
  if (!isOpen) return null;

  const removeTicketRow = (type: string) => {
    setSelectedTickets(selectedTickets.filter((t) => t !== type));
    setTicketPrices(ticketPrices.filter((item) => item.type !== type));
  };

  const handlePriceChange = (index: number, value: string) => {
    const updated = [...ticketPrices];
    updated[index].price = value;
    setTicketPrices(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
      {/* Modal Card Box */}
      <div className="w-full max-w-[540px] bg-white rounded-2xl border border-orange-500/20 p-5 shadow-xl relative transition-all">
        {/* Header Block */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-6 h-6 flex items-center justify-center rounded-full bg-[#FF474D] text-white hover:bg-red-600 transition"
            >
              <X size={13} strokeWidth={2.5} />
            </button>
            <span className="text-xs font-semibold text-gray-900 tracking-tight">
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
                onClick={() => toggleTicketType(type)}
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
            <span className="text-xs font-bold text-gray-800">Regular</span>
            <span className="text-xs font-bold text-gray-800">Price</span>
            <div></div>
          </div>

          {/* Table Input Rows */}
          <div className="space-y-2.5">
            {ticketPrices.map((ticket, index) => (
              <div
                key={ticket.type}
                className="grid grid-cols-[1fr_1fr_24px] gap-4 items-center"
              >
                <input
                  type="text"
                  value={ticket.type}
                  readOnly
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 outline-none select-none"
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
                  onClick={() => removeTicketRow(ticket.type)}
                  className="text-gray-300 hover:text-gray-500 transition flex justify-center"
                >
                  <Trash2 size={15} strokeWidth={1.5} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Add Trigger Style Button */}
        <button
          type="button"
          className="border border-dashed border-[#FF474D] text-[#FF474D] font-medium rounded-lg px-4 py-2 text-xs hover:bg-red-50/30 transition"
        >
          + Add Category
        </button>
      </div>
    </div>
  );
}

export default TicketPricingModal;

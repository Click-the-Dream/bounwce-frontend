"use client";

import React, { useState } from "react";
import {
  UploadCloud,
  Calendar,
  HelpCircle,
  AlertCircle,
  Eye,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import TicketPricingModal from "../_components/TicketPricingModal";
import { TICKET_TYPES } from "@/app/_utils/utility";
import BackBtn from "../_components/BackBtn";

export default function CreateEventPage() {
  const [selectedTickets, setSelectedTickets] = useState<string[]>([
    "VIP",
    "Regular",
  ]);
  const [dragActive, setDragActive] = useState(false);
  const [eventInterests, setEventInterests] = useState<string[]>([]);
  const [interestInput, setInterestInput] = useState("");
  const [ticketPrices, setTicketPrices] = useState<
    { type: string; price: string }[]
  >([
    { type: "VIP", price: "" },
    { type: "Regular", price: "" },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleTicketType = (type: string) => {
    if (selectedTickets.includes(type)) {
      setSelectedTickets(selectedTickets.filter((t) => t !== type));
      setTicketPrices(ticketPrices.filter((item) => item.type !== type));
    } else {
      setSelectedTickets([...selectedTickets, type]);
      setTicketPrices([...ticketPrices, { type, price: "" }]);
    }
  };

  const handleInterestChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.includes(",")) {
      const parts = value.split(",");

      const tagCandidate = parts[0].trim();

      if (tagCandidate && !eventInterests.includes(tagCandidate)) {
        setEventInterests([...eventInterests, tagCandidate]);
      }
      setInterestInput(parts.slice(1).join(","));
    } else {
      setInterestInput(value);
    }
  };

  const handleInterestKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && interestInput.trim()) {
      e.preventDefault();
      const cleanInput = interestInput.trim();

      if (!eventInterests.includes(cleanInput)) {
        setEventInterests([...eventInterests, cleanInput]);
      }
      setInterestInput("");
    }
  };

  const removeInterest = (interest: string) => {
    setEventInterests(eventInterests.filter((item) => item !== interest));
  };

  return (
    <div
      className="min-h-screen  max-w-170 mx-auto px-6 py-8 border-l-[0.53px] border-r-[0.53px] mb-5 border-[#00000033]"
      style={{
        borderColor: "#00000033",
      }}
    >
      <BackBtn />
      <div className="mb-8">
        <h1 className="text-2xl font-medium text-gray-900 tracking-tight">
          Create a New Event
        </h1>
        <p className="text-[13px] text-gray-400 mt-1">
          Send a broadcast request for your upcoming events
        </p>
      </div>

      <form className="space-y-4.75" onSubmit={(e) => e.preventDefault()}>
        {/* Banner Drag and Drop Container */}
        <div>
          <label className="block text-xs font-medium text-gray-800 mb-2">
            Event Banner <span className="text-[#FF474D]">*</span>
          </label>
          <div
            className={`border-2 border-dashed rounded-[10px] p-8 flex flex-col items-center justify-center transition ${
              dragActive
                ? "border-[#FF474D] bg-red-50/10"
                : "border-gray-200 bg-gray-50/30"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={() => setDragActive(false)}
          >
            <UploadCloud
              className="text-gray-400 mb-2"
              size={28}
              strokeWidth={1.5}
            />
            <p className="text-xs text-gray-500">
              Click to upload or drag and drop
            </p>
            <input
              type="file"
              className="hidden"
              id="banner-upload"
              accept="image/*"
            />
          </div>
        </div>

        {/* Name Field Input */}
        <div>
          <label className="block text-xs font-medium text-gray-800 mb-2">
            Event Name <span className="text-[#FF474D]">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g., Annual DevFest"
            className="w-full border border-gray-200 rounded-[10px] px-4 py-3 text-xs text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300 transition"
          />
        </div>

        {/* Description Field Input */}
        <div>
          <label className="block text-xs font-medium text-gray-800 mb-2">
            About Event <span className="text-[#FF474D]">*</span>
          </label>
          <textarea
            rows={4}
            placeholder="Describe what the event is about"
            className="w-full border border-gray-200 rounded-[10px] px-4 py-3 text-xs text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300 transition resize-none"
          />
        </div>

        {/* Interests Selector Field */}
        <div>
          <label className="block text-xs font-medium text-gray-800 mb-2">
            Event Interest <span className="text-[#FF474D]">*</span>
          </label>
          <div className="w-full min-h-11.5 border border-gray-200 rounded-[10px] px-3 py-2 flex flex-wrap items-center gap-2">
            {eventInterests.map((interest) => (
              <span
                key={interest}
                className="flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-md px-2 py-1 text-[11px] text-gray-600"
              >
                {interest}

                <button
                  type="button"
                  onClick={() => removeInterest(interest)}
                  className="text-sm text-gray-400 hover:text-gray-700"
                >
                  ×
                </button>
              </span>
            ))}

            <input
              value={interestInput}
              onChange={handleInterestChange}
              onKeyDown={handleInterestKeyDown}
              placeholder={
                eventInterests.length ? "" : "e.g. Entertainment, Party"
              }
              className="flex-1 min-w-30 text-xs outline-none bg-transparent"
            />
          </div>
        </div>

        {/* Date Time Picker Block */}
        <div>
          <label className="block text-xs font-medium text-gray-800 mb-2">
            Date <span className="text-[#FF474D]">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Select Date"
              className="w-full border border-gray-200 rounded-[10px] pl-4 pr-10 py-3 text-xs text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300 transition"
            />
            <Calendar
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              size={16}
            />
          </div>
        </div>

        {/* Pricing Segment Toggles */}
        <div>
          <div className="flex items-center gap-1 mb-2">
            <label className="text-xs font-medium text-gray-800">
              Ticket Price <span className="text-[#FF474D]">*</span>
            </label>
            <HelpCircle size={14} className="text-gray-400 cursor-help" />
          </div>

          <div className="border-[0.53px] border-gray-200 rounded-[10px] p-2.5 flex flex-wrap items-center gap-2 ">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="w-7 h-7 flex items-center justify-center text-sm rounded-lg bg-orange-50 border border-orange-200 text-[#FF474D] hover:bg-orange-100/70 transition shrink-0 cursor-pointer"
            >
              +
            </button>
            {TICKET_TYPES.map((type) => {
              const isSelected = selectedTickets.includes(type);
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className={`text-[11px] px-2.75 py-1 rounded-[20px] border transition flex items-center gap-1 ${
                    isSelected
                      ? "bg-orange-50/40 border-[#FF474D] text-[#FF474D]"
                      : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  <span className="text-gray-400">
                    {isSelected ? "✓" : "+"}
                  </span>{" "}
                  {type}
                </button>
              );
            })}
            <AlertCircle
              size={16}
              className="text-gray-500 ml-auto hidden sm:block"
            />
          </div>
        </div>

        {/* Location Block */}
        <div>
          <label className="block text-xs font-medium text-gray-800 mb-2">
            Location <span className="text-[#FF474D]">*</span>
          </label>
          <input
            type="text"
            placeholder="Virtual or Physical Address"
            className="w-full border border-gray-200 rounded-[10px] px-4 py-3 text-xs text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300 transition"
          />
        </div>

        {/* Optional Event Web Link Fields */}
        <div>
          <label className="block text-xs font-medium text-gray-800 mb-2">
            Link
          </label>
          <input
            type="url"
            placeholder="Add link if event is virtual...etc..."
            className="w-full border border-gray-200 rounded-[10px] px-4 py-3 text-xs text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300 transition"
          />
        </div>

        {/* Action Controls Group Footer */}
        <div className="pt-4 flex flex-wrap gap-1 items-center justify-between border-t border-gray-50">
          <button
            type="button"
            className="flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200/80 px-4 py-2.5 rounded-[10px] transition"
          >
            <Eye size={14} />
            Preview
          </button>

          <div className="flex items-center gap-3 ml-auto">
            <button
              type="button"
              className="text-xs font-medium text-black bg-white border-[0.83px] border-black rounded-[10px] px-5 py-2.5 hover:bg-gray-50 transition"
            >
              Save as Draft
            </button>
            <button
              type="submit"
              className="rounded-[10px] border border-black bg-orange px-5 py-2.5 text-xs font-medium text-white shadow-[inset_0_-4px_4px_0_rgba(0,0,0,0.25),inset_0_4px_4px_0_rgba(0,0,0,0.25),inset_-7px_0_4.4px_0_rgba(0,0,0,0.12),inset_7px_0_4px_-3px_rgba(0,0,0,0.25)] transition-all duration-200 hover:bg-[#e03e43] active:translate-y-px"
            >
              Create Event
            </button>
          </div>
        </div>
      </form>
      <TicketPricingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedTickets={selectedTickets}
        ticketPrices={ticketPrices}
        toggleTicketType={toggleTicketType}
        setTicketPrices={setTicketPrices}
        setSelectedTickets={setSelectedTickets}
      />
    </div>
  );
}

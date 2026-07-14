"use client";

import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  UploadCloud,
  Calendar,
  HelpCircle,
  AlertCircle,
  Eye,
} from "lucide-react";
import TicketPricingModal from "../_components/TicketPricingModal";
import { EventFormInputs, TICKET_TYPES } from "@/app/_utils/utility";
import BackBtn from "../_components/BackBtn";

export default function CreateEventPage() {
  const [dragActive, setDragActive] = useState(false);
  const [interestInput, setInterestInput] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<EventFormInputs>({
    defaultValues: {
      banner: null,
      name: "",
      description: "",
      interests: [],
      date: "",
      ticketPrices: [],
      locationType: "",
      address: "",
      meetingLink: "",
    },
  });

  const locationType = watch("locationType");
  const eventInterests = watch("interests") || [];
  const ticketPrices = watch("ticketPrices") || [];
  const selectedTickets = ticketPrices.map((item) => item.type);

  const setSelectedTickets = (
    types: string[] | ((prev: string[]) => string[]),
  ) => {
    const updatedTypes =
      typeof types === "function" ? types(selectedTickets) : types;
    const currentPrices = [...ticketPrices];

    let updatedPrices = currentPrices.filter((p) =>
      updatedTypes.includes(p.type),
    );

    updatedTypes.forEach((type) => {
      const exists = updatedPrices.some((p) => p.type === type);
      if (!exists) {
        updatedPrices.push({ type, price: "" });
      }
    });

    setValue("ticketPrices", updatedPrices, { shouldValidate: true });
  };

  const setTicketPrices = (
    prices:
      | { type: string; price: string }[]
      | ((
          prev: { type: string; price: string }[],
        ) => { type: string; price: string }[]),
  ) => {
    const updatedPrices =
      typeof prices === "function" ? prices(ticketPrices) : prices;
    setValue("ticketPrices", updatedPrices, { shouldValidate: true });
  };

  const toggleTicketType = (type: string) => {
    const isSelected = selectedTickets.includes(type);
    if (isSelected) {
      const updatedPrices = ticketPrices.filter((item) => item.type !== type);
      setValue("ticketPrices", updatedPrices, { shouldValidate: true });
    } else {
      const updatedPrices = [...ticketPrices, { type, price: "" }];
      setValue("ticketPrices", updatedPrices, { shouldValidate: true });
    }
  };

  // Interest tags management
  const handleInterestChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.includes(",")) {
      const parts = value.split(",");
      const tagCandidate = parts[0].trim();

      if (tagCandidate && !eventInterests.includes(tagCandidate)) {
        setValue("interests", [...eventInterests, tagCandidate], {
          shouldValidate: true,
        });
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
        setValue("interests", [...eventInterests, cleanInput], {
          shouldValidate: true,
        });
      }
      setInterestInput("");
    }
  };

  const removeInterest = (interest: string) => {
    setValue(
      "interests",
      eventInterests.filter((item) => item !== interest),
      { shouldValidate: true },
    );
  };

  // Banner image handler
  const handleBannerChange = (file: File | null) => {
    if (file) {
      setValue("banner", file, { shouldValidate: true });
    }
  };

  // Final form submission payload
  const onSubmit = (data: EventFormInputs) => {
    console.log("Form Data Submitted Successfully:", data);
    // Execute API calls here
  };
  const displayTickets = [
    ...TICKET_TYPES,
    ...selectedTickets.filter((t) => !TICKET_TYPES.includes(t)),
  ];

  return (
    <div
      className="min-h-screen max-w-170 mx-auto px-6 py-8 border-l-[0.53px] border-r-[0.53px] mb-5 border-[#00000033]"
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

      <form className="space-y-4.75" onSubmit={handleSubmit(onSubmit)}>
        {/* Banner Drag and Drop Container */}
        <div>
          <label className="block text-xs font-medium text-gray-800 mb-2">
            Event Banner <span className="text-[#FF474D]">*</span>
          </label>
          <Controller
            control={control}
            name="banner"
            rules={{ required: "Event banner is required" }}
            render={({ field }) => (
              <div
                className={`border-2 border-dashed rounded-[10px] p-8 flex flex-col items-center justify-center transition relative ${
                  dragActive
                    ? "border-[#FF474D] bg-red-50/10"
                    : "border-gray-200 bg-gray-50/30"
                } ${errors.banner ? "border-[#FF474D]" : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleBannerChange(e.dataTransfer.files[0]);
                  }
                }}
              >
                <label
                  htmlFor="banner-upload"
                  className="flex flex-col items-center justify-center cursor-pointer w-full h-full"
                >
                  <UploadCloud
                    className="text-gray-400 mb-2"
                    size={28}
                    strokeWidth={1.5}
                  />
                  <p className="text-xs text-gray-500">
                    {field.value
                      ? `Selected: ${(field.value as File).name}`
                      : "Click to upload or drag and drop"}
                  </p>
                  <input
                    type="file"
                    className="hidden"
                    id="banner-upload"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleBannerChange(e.target.files[0]);
                      }
                    }}
                  />
                </label>
              </div>
            )}
          />
          {errors.banner && (
            <p className="text-[11px] text-[#FF474D] mt-1">
              {errors.banner.message}
            </p>
          )}
        </div>

        {/* Name Field Input */}
        <div>
          <label className="block text-xs font-medium text-gray-800 mb-2">
            Event Name <span className="text-[#FF474D]">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g., Annual DevFest"
            className={`w-full border rounded-[10px] px-4 py-3 text-xs text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-1 transition ${
              errors.name
                ? "border-[#FF474D] focus:ring-[#FF474D]"
                : "border-gray-200 focus:ring-gray-300"
            }`}
            {...register("name", { required: "Event name is required" })}
          />
          {errors.name && (
            <p className="text-[11px] text-[#FF474D] mt-1">
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Description Field Input */}
        <div>
          <label className="block text-xs font-medium text-gray-800 mb-2">
            About Event <span className="text-[#FF474D]">*</span>
          </label>
          <textarea
            rows={4}
            placeholder="include information about the event"
            className={`w-full h-36.25 border rounded-[10px] px-4 py-3 text-xs text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-1 transition resize-none ${
              errors.description
                ? "border-[#FF474D] focus:ring-[#FF474D]"
                : "border-gray-200 focus:ring-gray-300"
            }`}
            {...register("description", {
              required: "Event description is required",
            })}
          />
          {errors.description && (
            <p className="text-[11px] text-[#FF474D] mt-1">
              {errors.description.message}
            </p>
          )}
        </div>

        {/* Interests Selector Field */}
        <div>
          <label className="block text-xs font-medium text-gray-800 mb-2">
            Event Interest <span className="text-[#FF474D]">*</span>
          </label>
          <div
            className={`w-full min-h-11.5 border rounded-[10px] px-3 py-2 flex flex-wrap items-center gap-2 ${
              errors.interests ? "border-[#FF474D]" : "border-gray-200"
            }`}
          >
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
          {/* Hidden register register point to hook form rules */}
          <input
            type="hidden"
            {...register("interests", {
              validate: (value) =>
                (value && value.length > 0) ||
                "At least one interest is required",
            })}
          />
          {errors.interests && (
            <p className="text-[11px] text-[#FF474D] mt-1">
              {errors.interests.message}
            </p>
          )}
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
              className={`w-full border rounded-[10px] pl-4 pr-10 py-3 text-xs text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-1 transition ${
                errors.date
                  ? "border-[#FF474D] focus:ring-[#FF474D]"
                  : "border-gray-200 focus:ring-gray-300"
              }`}
              {...register("date", { required: "Date is required" })}
            />
            <Calendar
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              size={16}
            />
          </div>
          {errors.date && (
            <p className="text-[11px] text-[#FF474D] mt-1">
              {errors.date.message}
            </p>
          )}
        </div>

        {/* Pricing Segment Toggles */}
        <div>
          <div className="flex items-center gap-1 mb-2">
            <label className="text-xs font-medium text-gray-800">
              Ticket Price <span className="text-[#FF474D]">*</span>
            </label>
            <HelpCircle size={14} className="text-gray-400 cursor-help" />
          </div>

          <div
            className={`border rounded-[10px] p-2.5 flex flex-wrap items-center gap-4 ${
              errors.ticketPrices ? "border-[#FF474D]" : "border-gray-200"
            }`}
          >
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="w-7 h-7 flex items-center justify-center text-sm rounded-lg bg-orange-50 border border-orange-200 text-[#FF474D] hover:bg-orange-100/70 transition shrink-0 cursor-pointer"
            >
              +
            </button>
            {displayTickets.map((type) => {
              const isSelected = selectedTickets.includes(type);
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      toggleTicketType(type);
                    } else {
                      toggleTicketType(type);
                      setIsModalOpen(true);
                    }
                  }}
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
          <input
            type="hidden"
            {...register("ticketPrices", {
              validate: (value) =>
                (value && value.length > 0) ||
                "At least one ticket price option must be active",
            })}
          />
          {errors.ticketPrices && (
            <p className="text-[11px] text-[#FF474D] mt-1">
              {errors.ticketPrices.message}
            </p>
          )}
        </div>

        {/* Location Type Selection */}
        <div>
          <select
            className={`w-full border rounded-[10px] px-2 py-3 text-xs text-gray-900 focus:outline-none focus:ring-1 transition ${
              errors.locationType
                ? "border-[#FF474D] focus:ring-[#FF474D]"
                : "border-gray-200 focus:ring-gray-300"
            }`}
            {...register("locationType", {
              required: "Please select a location setup",
            })}
          >
            <option value="" disabled>
              Location *
            </option>
            <option value="PHYSICAL">Physical</option>
            <option value="VIRTUAL">Virtual</option>
          </select>
          {errors.locationType && (
            <p className="text-[11px] text-[#FF474D] mt-1">
              {errors.locationType.message}
            </p>
          )}
        </div>

        {/* Conditional Address or Virtual Meeting Link field */}
        {locationType === "PHYSICAL" && (
          <div>
            <label className="block text-xs font-medium text-gray-800 mb-2">
              Event Address <span className="text-[#FF474D]">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Landmark Event Centre, Victoria Island, Lagos"
              className={`w-full border rounded-[10px] px-4 py-3 text-xs text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-1 transition ${
                errors.address
                  ? "border-[#FF474D] focus:ring-[#FF474D]"
                  : "border-gray-200 focus:ring-gray-300"
              }`}
              {...register("address", {
                required:
                  locationType === "PHYSICAL"
                    ? "Event location address is required"
                    : false,
              })}
            />
            {errors.address && (
              <p className="text-[11px] text-[#FF474D] mt-1">
                {errors.address.message}
              </p>
            )}
          </div>
        )}

        {locationType === "VIRTUAL" && (
          <div>
            <label className="block text-xs font-medium text-gray-800 mb-2">
              Meeting Link <span className="text-[#FF474D]">*</span>
            </label>
            <input
              type="url"
              placeholder="https://meet.google.com/... or https://zoom.us/..."
              className={`w-full border rounded-[10px] px-4 py-3 text-xs text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-1 transition ${
                errors.meetingLink
                  ? "border-[#FF474D] focus:ring-[#FF474D]"
                  : "border-gray-200 focus:ring-gray-300"
              }`}
              {...register("meetingLink", {
                required:
                  locationType === "VIRTUAL"
                    ? "A meeting connection URL is required"
                    : false,
              })}
            />
            {errors.meetingLink && (
              <p className="text-[11px] text-[#FF474D] mt-1">
                {errors.meetingLink.message}
              </p>
            )}
          </div>
        )}

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

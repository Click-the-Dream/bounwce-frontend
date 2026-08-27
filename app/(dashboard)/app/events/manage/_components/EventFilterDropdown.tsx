"use client";

import { ChevronDown, Check, SlidersHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type EventFilterValue =
  | ""
  | "draft"
  | "published"
  | "live"
  | "upcoming"
  | "date";

interface EventFilterDropdownProps {
  value: EventFilterValue;
  date?: string;
  onChange: (value: EventFilterValue) => void;
  onDateChange: (date: string) => void;
}

const options: {
  value: EventFilterValue;
  label: string;
}[] = [
  {
    value: "",
    label: "All events",
  },
  {
    value: "live",
    label: "Live",
  },
  {
    value: "upcoming",
    label: "Upcoming",
  },
  {
    value: "date",
    label: "Date",
  },
];

export default function EventFilterDropdown({
  value,
  date = "",
  onChange,
  onDateChange,
}: EventFilterDropdownProps) {
  const [open, setOpen] = useState(false);

  const ref = useRef<HTMLDivElement>(null);

  const selected =
    options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className={`flex items-center gap-1.5 rounded-[10px] px-3 py-2 text-xs font-medium transition cursor-pointer border ${
          value
            ? "bg-black text-white border-black"
            : "bg-[#949494] text-white border-[#949494] hover:bg-gray-600"
        }`}
      >
        <SlidersHorizontal size={13} strokeWidth={2.5} />

        {value ? selected.label : "Filter"}

        <ChevronDown
          size={13}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl">
          {options.map((option) => {
            const isSelected = value === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);

                  if (option.value !== "date") {
                    setOpen(false);
                  }
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-xs transition ${
                  isSelected
                    ? "bg-gray-100 text-gray-900 font-medium"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {option.label}

                {isSelected && option.value !== "date" && <Check size={14} />}
              </button>
            );
          })}

          {/* Date filter */}
          {value === "date" && (
            <div className="border-t border-gray-100 px-2 pb-2 pt-3">
              <label className="mb-1.5 block text-[11px] font-medium text-gray-500">
                Choose date
              </label>

              <input
                type="date"
                value={date}
                onChange={(event) => onDateChange(event.target.value)}
                className="w-full rounded-lg border border-gray-200 px-2.5 py-2 text-xs text-gray-800 outline-none focus:border-black"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

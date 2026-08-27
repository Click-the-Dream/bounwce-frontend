"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface PageSizeDropdownProps {
  value: number;
  onChange: (value: number) => void;
  options?: number[];
}

export default function PageSizeDropdown({
  value,
  onChange,
  options = [10, 20, 30, 50],
}: PageSizeDropdownProps) {
  const [open, setOpen] = useState(false);

  const ref = useRef<HTMLDivElement>(null);

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
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label="Number of events to display"
        aria-expanded={open}
        className="flex h-6 min-w-9 items-center justify-center gap-1 rounded-full bg-black px-2 text-[11px] font-medium text-white cursor-pointer"
      >
        Show {value}
        <ChevronDown
          size={11}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 min-w-30 rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                onChange(option);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs transition ${
                option === value
                  ? "bg-gray-100 font-medium text-gray-900"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              {option} per page
              {option === value && <Check size={13} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

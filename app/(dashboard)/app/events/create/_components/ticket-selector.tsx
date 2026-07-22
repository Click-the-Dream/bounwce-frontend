import React from "react";
import { UseFormRegister, useWatch } from "react-hook-form";
import { HelpCircle, AlertCircle, Plus } from "lucide-react";
import { EventFormInputs, TICKET_TYPES } from "@/app/_utils/utility";

interface TicketSelectorProps {
  register: UseFormRegister<EventFormInputs>;
  ticketPrices: Array<{ ticket_name: string; price: string }>;
  displayTickets: string[];
  onAddClick: () => void;
  onToggleTicket: (type: string) => void;
  error?: string;
}

export const TicketSelector: React.FC<TicketSelectorProps> = ({
  register,
  ticketPrices,
  displayTickets,
  onAddClick,
  onToggleTicket,
  error,
}) => {
  const selectedTickets = ticketPrices.map((item) => item.ticket_name);

  return (
    <div>
      <div className="flex items-center gap-1 mb-2">
        <label className="text-xs font-medium text-gray-800">
          Ticket Price <span className="text-orange">*</span>
        </label>
        <HelpCircle size={14} className="text-gray-400 cursor-help" />
      </div>

      <div
        className={`border rounded-[10px] p-2.5 flex flex-wrap items-center gap-4 ${
          error ? "border-orange" : "border-gray-200"
        }`}
      >
        <button
          type="button"
          onClick={onAddClick}
          className="w-7 h-7 flex items-center justify-center text-sm rounded-lg bg-orange-50 border-[0.53px] border-orange-200 text-orange hover:bg-orange-100/70 transition shrink-0 cursor-pointer"
        >
          <Plus size={14} />
        </button>

        {displayTickets.map((type) => {
          const isSelected = selectedTickets.includes(type);
          return (
            <button
              key={type}
              type="button"
              onClick={() => {
                if (isSelected) {
                  onToggleTicket(type);
                } else {
                  onToggleTicket(type);
                  onAddClick();
                }
              }}
              className={`text-[11px] px-2.75 py-1 rounded-[20px] border transition flex items-center gap-1 ${
                isSelected
                  ? "bg-orange-50/40 border-orange text-orange"
                  : " border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              <span className="text-orange">{isSelected ? "✓" : "+"}</span>
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
        {...register("ticket_info", {
          validate: (value: any[]) =>
            (value && value.length > 0) ||
            "At least one ticket price option must be active",
        })}
      />
      {error && <p className="text-[11px] text-orange mt-1">{error}</p>}
    </div>
  );
};

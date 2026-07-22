import { TicketInfo } from "@/app/_utils/types/event";
import { formatCurrency } from "@/app/_utils/utility";
import { Minus, Plus } from "lucide-react";

interface Prop {
  cat: TicketInfo;
  handleSelectCategory: any;
  isSelected: boolean;
  updateQuantity: any;
  qty: number;
  disabled?: boolean;
}
const TicketCard = ({
  cat,
  handleSelectCategory,
  isSelected,
  updateQuantity,
  qty,
  disabled = Boolean(cat.price < 1),
}: Prop) => {
  return (
    <div
      onClick={() => handleSelectCategory(cat.ticket_name)}
      className={`flex items-center justify-between p-4 bg-white rounded-[9px] cursor-pointer transition-all shadow-sm ${
        isSelected
          ? "border-[1.5px] border-orange outline-[0.53px] outline-offset-2 outline-orange"
          : "border-transparent hover:border-gray-200"
      }`}
    >
      {/* Selection Indicator & Name */}
      <div className="flex items-center gap-3.5">
        <div
          className={`w-5 h-5 rounded-full flex items-center justify-center ${
            isSelected
              ? "outline-[1.5px] outline-orange"
              : "outline-[0.53px] outline-[#CDCDCD]"
          }`}
        >
          <div
            className={`w-4 h-4 rounded-full border-[0.5px]  ${isSelected ? "border-orange bg-orange" : "border-[#ccc] bg-white"}`}
          />
        </div>
        <span className="font-medium text-black text-sm">
          {cat.ticket_name}
        </span>
      </div>

      {/* Quantity Controls & Cost */}
      <div
        className="flex items-center gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center p-1">
          <button
            disabled={disabled}
            onClick={() => updateQuantity(cat.ticket_name, -1)}
            className="cursor-pointer p-1 hover:bg-gray-200 text-gray-500 transition  border border-gray-200 rounded-md disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <Minus size={12} />
          </button>
          <span className="w-7 text-center text-[8.8px] text-black">{qty}</span>
          <button
            disabled={disabled}
            onClick={() => updateQuantity(cat.ticket_name, 1)}
            className="cursor-pointer p-1 hover:bg-gray-200 text-gray-500 transition  border border-gray-200 rounded-md disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <Plus size={12} />
          </button>
        </div>
        <span className="font-semibold text-black text-right text-sm">
          {formatCurrency(cat.price)}
        </span>
      </div>
    </div>
  );
};

export default TicketCard;

"use client";
import { useState } from "react";
import { Users, Minus, Plus } from "lucide-react";
import { CustomCalendarIcon, CustomMapPinIcon } from "@/app/_utils/CustomIcons";

const TICKET_CATEGORIES = [
  { id: "regular", name: "Regular", price: 1500 },
  { id: "vip", name: "VIP", price: 15000 },
  { id: "vvip", name: "VVIP", price: 50000 },
  { id: "table_10", name: "Table for 10", price: 150000 },
];

export default function EventDetails() {
  const [selectedCategoryId, setSelectedCategoryId] = useState("regular");
  const [quantities, setQuantities] = useState({
    regular: 1,
    vip: 0,
    vvip: 0,
    table_10: 0,
  });

  const handleSelectCategory = (id: any) => {
    setSelectedCategoryId(id);
    setQuantities((prev: any) => {
      const next = { regular: 0, vip: 0, vvip: 0, table_10: 0 };
      next[id] = prev[id] > 0 ? prev[id] : 1;
      return next;
    });
  };

  const updateQuantity = (id: string, amount: number) => {
    const minVal = id === selectedCategoryId ? 1 : 0;
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.max(minVal, (prev[id] || 0) + amount),
    }));
  };

  const activeCategory = TICKET_CATEGORIES.find(
    (cat) => cat.id === selectedCategoryId,
  );
  const activeQty = quantities[selectedCategoryId] || 0;
  const subtotal = activeCategory ? activeCategory.price * activeQty : 0;
  const serviceFee = Math.round(subtotal * 0.05);
  const total = subtotal + serviceFee;

  const formatCurrency = (value: number) => {
    return "₦" + value.toLocaleString("en-NG");
  };

  return (
    <div className="pb-20">
      {/* Page Title Header */}
      <div className="my-8">
        <h1 className="text-2xl font-medium tracking-tight text-black">
          Get Ticket
        </h1>
        <p className="text-[13px] text-gray-700 font-medium mt-1">
          Burnaboy Live in Concert -- O2 Arena
        </p>
      </div>

      {/* Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column - Event Card & Categories */}
        <div className="lg:col-span-7 space-y-6">
          {/* Featured Event Card */}
          <div
            className="relative rounded-[10px] overflow-hidden shadow-lg h-34 bg-cover bg-center flex flex-col justify-between p-2 pb-0 text-white"
            style={{
              backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.85)), url('https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80')`,
            }}
          >
            <span className="absolute top-2 left-2 bg-white/20 backdrop-blur-xs border border-white/40 text-white text-[10px] font-medium tracking-wider px-2.5 py-1 rounded-md uppercase transition-all duration-300 group-hover:bg-white/30">
              Upcoming
            </span>
            <div className="mt-auto space-y-2">
              <h2 className="text-2xl font-irish font-bold tracking-wide">
                Burnaboy Live in Concert
              </h2>

              <div className="space-x-4 mb-4 flex gap-1 flex-wrap items-center text-white">
                <div className="flex items-center text-xs gap-1">
                  <CustomCalendarIcon />
                  <span>May 28, 2025</span>
                </div>
                <div className="flex items-center text-xs font-medium gap-1">
                  <CustomMapPinIcon />
                  <span>O2 Arena</span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <Users size={15} className="text-[#34D399]" />
                  <span>400 going</span>
                </div>
              </div>
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <p className="text-gray-500 my-4 text-[13px]">
              Choose a ticket category
            </p>
            <div className="space-y-3">
              {TICKET_CATEGORIES.map((cat: any) => {
                const isSelected = selectedCategoryId === cat.id;
                const qty = quantities[cat.id] || 0;

                return (
                  <div
                    key={cat.id}
                    onClick={() => handleSelectCategory(cat.id)}
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
                        {cat.name}
                      </span>
                    </div>

                    {/* Quantity Controls & Cost */}
                    <div
                      className="flex items-center gap-5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center p-1">
                        <button
                          onClick={() => updateQuantity(cat.id, -1)}
                          className="cursor-pointer p-1 hover:bg-gray-200 text-gray-500 transition  border border-gray-200 rounded-md"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-7 text-center text-[8.8px] text-black">
                          {qty}
                        </span>
                        <button
                          onClick={() => updateQuantity(cat.id, 1)}
                          className="cursor-pointer p-1 hover:bg-gray-200 text-gray-500 transition  border border-gray-200 rounded-md"
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
              })}
            </div>
          </div>
        </div>

        {/* Right Column - Order Summary */}
        <div className="lg:col-span-5 lg:sticky lg:top-16">
          <div className="bg-white rounded-xl p-6 shadow-xl border-[0.53px] border-black/10">
            <h3 className="text-[13px] font-bold text-black mb-6">
              Order Summary
            </h3>

            <div className="space-y-4 text-xs mb-6">
              {/* Dynamically displays chosen item */}
              {activeQty > 0 && activeCategory && (
                <div className="flex justify-between items-center text-gray-600">
                  <span>
                    {activeCategory.name} x {activeQty}
                  </span>
                  <span className="font-semibold text-black">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
              )}

              {/* Service Fee */}
              <div className="flex justify-between items-center text-gray-600">
                <span>Service fee (5%)</span>
                <span className="font-semibold text-gray-800">
                  {formatCurrency(serviceFee)}
                </span>
              </div>

              <div className="border-t border-dashed border-gray-200 pt-4 mt-4 flex justify-between items-center text-xs font-bold text-black">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Action Button */}
            <button className="text-[13px] w-full bg-black hover:bg-neutral-800 text-white font-semibold py-2.5 rounded-[10px] tracking-wide transition shadow-md active:scale-[0.98]">
              Pay {formatCurrency(total)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

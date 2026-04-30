import React from "react";

export default function ProductCard({ compact }: any) {
  return (
    <div
      className="
        bg-white
        rounded-xl
        p-3
        border border-gray-100
        hover:shadow-sm
        hover:-translate-y-0.5
        transition
        duration-200
        flex flex-col
        gap-1
      "
    >
      {/* IMAGE */}
      <div
        className={`
          bg-gray-100 rounded-[10px] mb-2
          ${compact ? "h-24" : "h-32"}
        `}
      />

      {/* TITLE */}
      <div className="text-sm font-medium text-gray-900 truncate">
        Product Name
      </div>

      {/* PRICE (PRIMARY SIGNAL) */}
      <div className="text-indigo-600 font-semibold text-sm">₦12,000</div>

      {/* SECONDARY INFO */}
      <div className="text-xs text-gray-400">Rating 4.5</div>

      {/* CTA (muted but clear) */}
      <button
        className="
          mt-2 w-full py-2 text-xs
          bg-gray-900 text-white
          rounded-[10px]
          hover:bg-black
          active:scale-[0.98]
          transition
        "
      >
        Add to Cart
      </button>
    </div>
  );
}

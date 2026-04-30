import React from "react";
import { ShieldCheck, Truck, BadgeCheck, RefreshCcw } from "lucide-react";

const items = [
  { label: "Secure Payments", icon: ShieldCheck },
  { label: "Fast Delivery", icon: Truck },
  { label: "Verified Sellers", icon: BadgeCheck },
  { label: "Easy Returns", icon: RefreshCcw },
];

export default function TrustBar() {
  return (
    <section
      className="
        flex flex-wrap md:flex-nowrap
        items-center justify-between
        gap-3
        bg-white
        border border-gray-100
        p-4 md:p-5
        rounded-2xl
      "
    >
      {items.map((item, i) => {
        const Icon = item.icon;

        return (
          <div
            key={i}
            className="
              flex items-center gap-2
              px-3 py-2
              rounded-xl
              hover:bg-gray-50
              transition
              cursor-default
              min-w-fit
            "
          >
            {/* ICON WRAPPER */}
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gray-100">
              <Icon size={16} className="text-gray-700" />
            </div>

            {/* LABEL */}
            <span className="text-sm text-gray-600 whitespace-nowrap">
              {item.label}
            </span>
          </div>
        );
      })}
    </section>
  );
}

import React from "react";
import { Tag, Sparkles, Truck, TrendingUp, ShoppingBag } from "lucide-react";

const items = [
  { label: "Deals", icon: Tag },
  { label: "New Arrivals", icon: Sparkles },
  { label: "Free Delivery", icon: Truck },
  { label: "Trending", icon: TrendingUp },
  { label: "Essentials", icon: ShoppingBag },
];

export default function QuickActions() {
  return (
    <div className="flex gap-3 overflow-x-auto no-scrollbar">
      {items.map((item, i) => {
        const Icon = item.icon;

        return (
          <div
            key={i}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm whitespace-nowrap"
          >
            <Icon size={16} />
            <span className="text-sm">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

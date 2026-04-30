import React from "react";
import { Shirt, Laptop, Home, Dumbbell } from "lucide-react";

const categories = [
  { label: "Fashion", icon: Shirt },
  { label: "Electronics", icon: Laptop },
  { label: "Home", icon: Home },
  { label: "Sports", icon: Dumbbell },
];

export default function CategoryGrid() {
  return (
    <section>
      <h2 className="text-lg font-semibold mb-4">Categories</h2>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {categories.map((cat, i) => {
          const Icon = cat.icon;

          return (
            <div
              key={i}
              className="bg-white rounded-xl p-4 text-center shadow-sm hover:shadow-md"
            >
              <Icon className="mx-auto mb-2" size={18} />
              <span className="text-sm">{cat.label}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

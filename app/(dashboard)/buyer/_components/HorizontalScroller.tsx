import React from "react";
import ProductCard from "./ProductCard";

export default function HorizontalScroller({ title }: any) {
  const products = new Array(8).fill(null);

  return (
    <section>
      {/* HEADER */}
      <h2 className="text-lg font-semibold mb-4">{title}</h2>

      {/* SCROLLER */}
      <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory no-scrollbar">
        {products.map((_, i) => (
          <div key={i} className="min-w-[170px] snap-start">
            <ProductCard compact />
          </div>
        ))}
      </div>
    </section>
  );
}

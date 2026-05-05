import { useEffect, useState } from "react";
import { Award, Star } from "lucide-react";
import { motion } from "framer-motion";

const vendors = [
  {
    name: "Prime Gadgets",
    followers: "2.4k",
    rating: "4.8",
  },
  {
    name: "Urban Fashion Hub",
    followers: "1.8k",
    rating: "4.6",
  },
  {
    name: "HomeCraft Living",
    followers: "3.1k",
    rating: "4.9",
  },
  {
    name: "NextGen Tech",
    followers: "2.0k",
    rating: "4.7",
  },
];

const TopVendors = () => {
  return (
    <section>
      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Trusted Stores</h2>

        <button className="text-sm text-gray-500 hover:text-gray-900 transition">
          View all
        </button>
      </div>

      {/* CAROUSEL */}
      <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
        {vendors?.map((vendor, i) => (
          <motion.div
            key={vendor.name}
            layout
            initial={{ opacity: 0.6, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="
              min-w-60
              bg-white
              rounded-xl
              p-5
              border border-gray-200
              hover:shadow-sm
              transition
              flex flex-col
              justify-between
              relative
            "
          >
            {/* subtle live glow */}
            <div className="absolute inset-0 rounded-xl bg-linear-to-tr from-transparent via-transparent to-gray-50 opacity-0 hover:opacity-100 transition pointer-events-none" />

            {/* HEADER */}
            <div className="flex items-start gap-3 relative z-10">
              <div className="h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-600">
                {vendor.name.charAt(0)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium text-gray-900 truncate">
                    {vendor.name}
                  </span>

                  <Award
                    size={16}
                    className="text-orange-500 shrink-0 ml-auto"
                  />
                </div>

                <div className="text-xs text-gray-500 mt-0.5">
                  {vendor.followers} followers
                </div>
              </div>
            </div>

            {/* METRICS */}
            <div className="flex items-center gap-2 mt-4 text-sm text-gray-600 relative z-10">
              <Star size={14} className="text-yellow-500" />
              <span>{vendor.rating} rating</span>
            </div>

            {/* CTA */}
            <button className="mt-5 w-full py-2.5 rounded-lg text-sm font-medium bg-gray-900 text-white hover:bg-black transition relative z-10">
              View Store
            </button>
          </motion.div>
        ))}
      </div>

      {/* subtle live indicator */}
      <div className="mt-2 text-xs text-gray-400">
        Live trusted vendor rankings updating
      </div>
    </section>
  );
};

export default TopVendors;

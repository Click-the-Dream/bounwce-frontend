import React from "react";
import { ArrowRight, Sparkles, TrendingUp, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

const promos = [
  {
    title: "Recommended for You",
    desc: "Selections based on your activity and preferences.",
    icon: Sparkles,
  },
  {
    title: "Best Value Available",
    desc: "High-quality products at competitive prices.",
    icon: ShieldCheck,
  },
  {
    title: "Trending in Your Area",
    desc: "Products gaining traction among nearby buyers.",
    icon: TrendingUp,
  },
];

export default function PromoCards() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {promos.map((p, i) => {
        const Icon = p.icon;

        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.05 }}
            className="
              bg-white
              border border-gray-200
              rounded-2xl
              p-6
              transition
              hover:border-gray-300
              hover:-translate-y-[2px]
              hover:shadow-sm
              flex flex-col
              justify-between
            "
          >
            {/* ICON */}
            <div className="p-2 w-fit rounded-lg bg-gray-100">
              <Icon size={18} className="text-gray-700" />
            </div>

            {/* CONTENT */}
            <div className="mt-4">
              <h3 className="font-semibold text-base text-gray-900">
                {p.title}
              </h3>

              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                {p.desc}
              </p>
            </div>

            {/* CTA */}
            <button
              className="
                mt-6 flex items-center gap-2
                text-sm font-medium text-gray-900
                group
                w-fit
              "
            >
              Explore
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-1"
              />
            </button>
          </motion.div>
        );
      })}
    </section>
  );
}

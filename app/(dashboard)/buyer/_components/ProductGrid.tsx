import { useEffect, useState } from "react";
import { Product } from "@/app/_utils/types/market";
import ProductCard from "@/app/marketplace/_components/ProductCard";
import { motion, AnimatePresence } from "framer-motion";

export default function ProductGrid({
  title,
  subtitle,
  products = [],
  loading = false,
  error = null,
  onRetry,
}: any) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section>
      {/* HEADER */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold">{title}</h2>

        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>

      {/* LOADING STATE (stable skeleton grid, no layout shift) */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-64 rounded-xl bg-gray-100 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* ERROR STATE */}
      {!loading && error && (
        <div className="py-10 text-center border border-dashed border-gray-200 rounded-xl">
          <p className="text-sm text-gray-600">Failed to load products.</p>

          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 text-sm px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
            >
              Try again
            </button>
          )}
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && !error && products.length === 0 && (
        <div className="py-10 text-center border border-dashed border-gray-200 rounded-xl">
          <p className="text-sm text-gray-500">
            No products available right now.
          </p>
        </div>
      )}

      {/* GRID */}
      {!loading && !error && products.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {products.map((product: Product, index: number) => (
              <motion.div
                key={product.id}
                initial={mounted ? { opacity: 0, y: 8 } : false}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{
                  duration: 0.25,
                  delay: index * 0.03,
                  ease: "easeOut",
                }}
                layout
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}

"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  MapPin,
  Phone,
  Mail,
  Search,
  Filter,
  Share2,
  MessageCircle,
  Package,
  AlertCircle,
} from "lucide-react";

import useStore from "@/app/hooks/use-store";
import useProduct from "@/app/hooks/use-product";
import useUser from "@/app/hooks/use-user";
import ProductCard from "@/app/marketplace/_components/ProductCard";
import SafeImage from "@/app/_components/SafeImage";

const StoreFront = () => {
  const { storeId } = useParams<{ storeId: string }>();

  const { useGetStoreInfo } = useStore();
  const { useGetUserById } = useUser();
  const { useGetStoreProducts } = useProduct();

  const { data: store, isLoading: storeLoading } = useGetStoreInfo(storeId);
  const { data: vendor } = useGetUserById(store?.user_id);
  const { data: products, isLoading: productsLoading } = useGetStoreProducts(
    store?.id,
  );

  const [query, setQuery] = useState("");

  const productList = useMemo(
    () => products?.pages?.flatMap((p: any) => p?.products ?? []) ?? [],
    [products],
  );

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return productList;

    return productList.filter((p: any) => p?.name?.toLowerCase().includes(q));
  }, [productList, query]);

  if (storeLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-50">
        <Loader2 className="w-7 h-7 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-2 text-zinc-500 bg-zinc-50">
        <AlertCircle size={32} className="text-zinc-300" />
        <p className="text-sm font-medium">Store not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      {/* ================= HEADER ================= */}
      <header className="border-b border-zinc-100">
        {/* Banner */}
        <div className="relative h-44 md:h-72 bg-zinc-100">
          {store?.store_banner?.url && (
            <SafeImage
              src={store.store_banner.url}
              alt={store.name}
              width={1920}
              height={800}
              className="w-full h-full object-cover"
            />
          )}

          {/* subtle overlay only */}
          <div className="absolute inset-0 bg-black/10" />

          <div className="absolute top-4 right-4">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white text-[11px] font-medium shadow-sm border border-zinc-200">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Open
            </span>
          </div>
        </div>

        {/* STORE INFO */}
        <div className="max-w-6xl mx-auto px-4 -mt-10 md:-mt-14 relative">
          <div className="bg-white border border-zinc-100 rounded-2xl shadow-sm p-5 md:p-6 flex flex-col md:flex-row gap-5">
            {/* Logo */}
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden bg-zinc-100 shrink-0">
              {store?.store_logo?.url ? (
                <SafeImage
                  src={store.store_logo.url}
                  alt={store.name}
                  width={100}
                  height={100}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-400 text-xl font-semibold">
                  {store?.name?.charAt(0)}
                </div>
              )}
            </div>

            {/* INFO */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                {store?.name}
              </h1>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500 mt-1">
                <span className="flex items-center gap-1">
                  <MapPin size={13} /> {store?.address || "No address"}
                </span>
                <span>•</span>
                <span>{vendor?.name || "Vendor"}</span>
              </div>

              <p className="text-sm text-zinc-500 mt-2 line-clamp-2">
                {store?.store_description || "No description available"}
              </p>
            </div>

            {/* ACTIONS */}
            <div className="flex md:flex-col gap-2 md:justify-center">
              <button className="px-4 py-2 rounded-lg bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 transition flex items-center justify-center gap-2">
                <MessageCircle size={14} />
                Message
              </button>

              <button className="px-4 py-2 rounded-lg border border-zinc-200 text-xs font-medium hover:bg-zinc-50 transition flex items-center justify-center gap-2">
                <Share2 size={14} />
                Share
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ================= TOOLBAR ================= */}
      <div className="sticky top-0 z-20 bg-white border-b border-zinc-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex gap-3 items-center">
          <div className="flex-1 relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900/10"
            />
          </div>

          <button className="px-3 py-2 border border-zinc-200 rounded-lg text-sm flex items-center gap-2 hover:bg-zinc-50">
            <Filter size={15} />
            Filter
          </button>
        </div>
      </div>

      {/* ================= PRODUCTS ================= */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Package size={18} /> Products
            </h2>
            <p className="text-xs text-zinc-500">
              {filteredProducts.length} items available
            </p>
          </div>
        </div>

        {productsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-64 bg-zinc-100 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 text-zinc-500 text-sm">
            No products found
          </div>
        ) : (
          <motion.div className="grid grid-cols-auto gap-4">
            <AnimatePresence>
              {filteredProducts.map((product: any) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

{/* ================= LOCATION ================= */}
<section className="max-w-6xl mx-auto px-4 pt-8">
  <div className="overflow-hidden rounded-3xl border border-zinc-100 bg-[#f7f4ef]">
    <div className="grid lg:grid-cols-2">
      {/* LEFT MAP PREVIEW */}
      <div className="relative min-h-[260px] bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:40px_40px] flex items-center justify-center">
        {/* map cross */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-px bg-black/5 absolute" />
          <div className="h-full w-px bg-black/5 absolute" />
        </div>

        {/* pin */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="relative"
        >
          <div className="absolute inset-0 rounded-full bg-orange-500/20 animate-ping" />

          <div className="relative w-14 h-14 rounded-full bg-orange-500 flex items-center justify-center shadow-lg">
            <MapPin size={22} className="text-white" />
          </div>
        </motion.div>
      </div>

      {/* RIGHT INFO */}
      <div className="p-6 md:p-8 flex flex-col justify-center">
        <span className="text-[11px] tracking-[0.25em] uppercase text-orange-500 font-medium">
          Find Us
        </span>

        <h2 className="text-3xl md:text-5xl font-semibold tracking-tight mt-2">
          {store?.address || "Store location"}
        </h2>

        <div className="mt-6 space-y-3">
          <div className="rounded-2xl bg-white border border-black/5 p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
              <MapPin size={18} className="text-orange-500" />
            </div>

            <div>
              <p className="text-sm font-medium text-zinc-900">
                {store?.address}
              </p>

              <p className="text-xs text-zinc-500 mt-1">
                Approximately 0.7km from your location
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white border border-black/5 p-4">
              <p className="text-[10px] uppercase tracking-wider text-zinc-400">
                Mon - Fri
              </p>

              <p className="mt-1 text-sm font-medium">
                8AM – 10PM
              </p>
            </div>

            <div className="rounded-2xl bg-white border border-black/5 p-4">
              <p className="text-[10px] uppercase tracking-wider text-zinc-400">
                Saturday
              </p>

              <p className="mt-1 text-sm font-medium">
                9AM – 11PM
              </p>
            </div>

            <div className="rounded-2xl bg-white border border-black/5 p-4">
              <p className="text-[10px] uppercase tracking-wider text-zinc-400">
                Sunday
              </p>

              <p className="mt-1 text-sm font-medium">
                10AM – 8PM
              </p>
            </div>

            <div className="rounded-2xl bg-white border border-black/5 p-4">
              <p className="text-[10px] uppercase tracking-wider text-zinc-400">
                Delivery
              </p>

              <p className="mt-1 text-sm font-medium">
                20–30 mins
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-zinc-100 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-10 grid md:grid-cols-3 gap-8 text-sm text-zinc-600">
          <div>
            <h4 className="text-xs font-medium text-zinc-400 mb-2">About</h4>
            <p>{store?.store_description}</p>
          </div>

          <div>
            <h4 className="text-xs font-medium text-zinc-400 mb-2">Contact</h4>
            <div className="space-y-2">
              <p className="flex items-center gap-2">
                <Phone size={14} /> {store?.phone_number}
              </p>
              <p className="flex items-center gap-2">
                <Mail size={14} /> {store?.email}
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-medium text-zinc-400 mb-2">Location</h4>
            <p className="flex items-center gap-2">
              <MapPin size={14} /> {store?.address}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default StoreFront;

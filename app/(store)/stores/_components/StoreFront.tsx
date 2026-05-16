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
          <div className="grid grid-cols-store gap-4">
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
          <motion.div className="grid grid-cols-store gap-4">
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
<section className="max-w-7xl mx-auto px-4 py-16">
  <div className="grid lg:grid-cols-[1.15fr_.85fr] gap-6 items-stretch">
    {/* MAP SIDE */}
    <div className="relative overflow-hidden rounded-[2rem] border border-zinc-200 bg-[#f7f4ef] min-h-[320px] lg:min-h-[460px]">
      {/* soft grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:42px_42px]" />

      {/* cross lines */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="absolute w-full h-px bg-black/5" />
        <div className="absolute h-full w-px bg-black/5" />
      </div>

      {/* animated pin */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="relative"
        >
          <div className="absolute inset-0 rounded-full bg-orange-500/20 animate-ping" />

          <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-orange-500 shadow-[0_10px_40px_rgba(249,115,22,0.35)]">
            <MapPin className="text-white" size={26} />
          </div>
        </motion.div>
      </div>

      {/* floating distance card */}
      <div className="absolute left-4 right-4 bottom-4 md:left-6 md:right-auto md:w-[280px]">
        <div className="backdrop-blur-xl bg-white/85 border border-white/40 rounded-2xl p-4 shadow-lg">
          <p className="text-[11px] uppercase tracking-[0.25em] text-orange-500 font-medium">
            Distance
          </p>

          <h3 className="mt-2 text-3xl font-semibold tracking-tight">
            0.7km away.
          </h3>

          <p className="mt-2 text-sm text-zinc-500">
            Fast delivery and easy pickup available from your location.
          </p>
        </div>
      </div>
    </div>

    {/* INFO SIDE */}
    <div className="flex flex-col justify-between rounded-[2rem] border border-zinc-200 bg-white p-6 md:p-8">
      <div>
        <span className="text-[11px] uppercase tracking-[0.25em] text-orange-500 font-medium">
          Find Us
        </span>

        <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight leading-tight">
          Visit our store location anytime.
        </h2>

        <p className="mt-4 text-sm md:text-base text-zinc-500 leading-relaxed">
          {store?.address ||
            "Visit our physical location for pickup, inquiries, and in-store purchases."}
        </p>
      </div>

      <div className="mt-8 space-y-4">
        {/* address */}
        <div className="flex gap-4 rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
          <div className="w-11 h-11 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
            <MapPin size={18} className="text-orange-500" />
          </div>

          <div>
            <p className="font-medium text-sm">
              {store?.address || "Store address"}
            </p>

            <p className="text-xs text-zinc-500 mt-1">
              Open navigation or contact vendor for precise directions.
            </p>
          </div>
        </div>

        {/* timing cards */}
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              label: "Mon - Fri",
              value: "8AM – 10PM",
            },
            {
              label: "Saturday",
              value: "9AM – 11PM",
            },
            {
              label: "Sunday",
              value: "10AM – 8PM",
            },
            {
              label: "Delivery",
              value: "20 – 30 mins",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4"
            >
              <p className="text-[10px] uppercase tracking-wider text-zinc-400">
                {item.label}
              </p>

              <p className="mt-1 text-sm font-semibold">
                {item.value}
              </p>
            </div>
          ))}
        </div>

        {/* actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button className="flex-1 h-11 rounded-xl bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 transition">
            Open Directions
          </button>

          <button className="flex-1 h-11 rounded-xl border border-zinc-200 text-sm font-medium hover:bg-zinc-50 transition">
            Contact Store
          </button>
        </div>
      </div>
    </div>
  </div>
</section>

      {/* ================= FOOTER ================= */}
<footer className="mt-24 border-t border-zinc-100 bg-zinc-50">
  <div className="max-w-7xl mx-auto px-4 py-16">
    <div className="grid gap-12 lg:grid-cols-[1.3fr_.7fr_.7fr_.8fr]">
      {/* BRAND */}
      <div>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl overflow-hidden bg-zinc-200">
            {store?.store_logo?.url ? (
              <SafeImage
                src={store.store_logo.url}
                alt={store.name}
                width={60}
                height={60}
                className="w-full h-full object-cover"
              />
            ) : null}
          </div>

          <div>
            <h3 className="font-semibold text-lg tracking-tight">
              {store?.name}
            </h3>

            <p className="text-sm text-zinc-500">
              Trusted marketplace vendor
            </p>
          </div>
        </div>

        <p className="mt-5 text-sm leading-relaxed text-zinc-600 max-w-md">
          {store?.store_description ||
            "Quality products, reliable delivery, and a modern shopping experience."}
        </p>

        <div className="flex gap-3 mt-6">
          <button className="h-11 px-5 rounded-xl bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 transition">
            Message Vendor
          </button>

          <button className="h-11 px-5 rounded-xl border border-zinc-200 text-sm font-medium hover:bg-white transition">
            Share Store
          </button>
        </div>
      </div>

      {/* CONTACT */}
      <div>
        <h4 className="text-sm font-semibold mb-5">Contact</h4>

        <div className="space-y-4 text-sm text-zinc-600">
          <div>
            <p className="text-zinc-400 text-xs mb-1">Phone</p>
            <p>{store?.phone_number || "Not available"}</p>
          </div>

          <div>
            <p className="text-zinc-400 text-xs mb-1">Email</p>
            <p>{store?.email || "Not available"}</p>
          </div>
        </div>
      </div>

      {/* STORE */}
      <div>
        <h4 className="text-sm font-semibold mb-5">Store</h4>

        <div className="space-y-3 text-sm text-zinc-600">
          <p>All Products</p>
          <p>New Arrivals</p>
          <p>Popular Items</p>
          <p>Store Reviews</p>
        </div>
      </div>

      {/* NEWSLETTER */}
      <div>
        <h4 className="text-sm font-semibold mb-5">
          Stay updated
        </h4>

        <p className="text-sm text-zinc-500 leading-relaxed">
          Get notified about new arrivals and exclusive offers.
        </p>

        <div className="mt-5 flex flex-col gap-3">
          <input
            placeholder="Enter your email"
            className="h-11 px-4 rounded-xl border border-zinc-200 bg-white text-sm outline-none focus:ring-2 focus:ring-zinc-900/5"
          />

          <button className="h-11 rounded-xl bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition">
            Subscribe
          </button>
        </div>
      </div>
    </div>

    {/* bottom */}
    <div className="mt-14 pt-6 border-t border-zinc-200 flex flex-col md:flex-row gap-4 items-center justify-between text-xs text-zinc-500">
      <p>
        © {new Date().getFullYear()} {store?.name}. All rights reserved.
      </p>

      <div className="flex items-center gap-5">
        <button className="hover:text-zinc-900 transition">
          Privacy
        </button>

        <button className="hover:text-zinc-900 transition">
          Terms
        </button>

        <button className="hover:text-zinc-900 transition">
          Support
        </button>
      </div>
    </div>
  </div>
</footer>
    </div>
  );
};

export default StoreFront;

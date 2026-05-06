"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import useStore from "@/app/hooks/use-store";
import { Search } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Navbar from "@/app/_components/Navbar";
import Footer from "@/app/_components/Footer";

const StoreSkeleton = () => {
  return (
    <div className="animate-pulse bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="h-32 bg-gray-200" />
      <div className="p-4 relative">
        <div className="absolute -top-8 left-4 w-16 h-16 bg-gray-300 rounded-xl border-4 border-white" />
        <div className="pt-10 space-y-2">
          <div className="h-4 bg-gray-300 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-full" />
          <div className="h-3 bg-gray-200 rounded w-5/6" />
        </div>
      </div>
    </div>
  );
};

const Stores = () => {
  const { useGetStores } = useStore();
  const [name, setName] = useState("");
  const router = useRouter();

  const params = useMemo(() => ({ name, page_size: 8 }), [name]);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useGetStores(params);

  const stores = data?.pages?.flatMap((page: any) => page.stores) || [];

  // Intersection Observer
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!loadMoreRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 1 },
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage]);

  return (
    <div className="px-6 py-8 max-w-250 mx-auto w-full">
      <Navbar />
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:justify-between gap-4 mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Explore Stores</h1>

        {/* SEARCH */}
        <div className="relative w-full md:w-80">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Search stores..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black text-sm"
          />
        </div>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Skeletons (initial load) */}
        {isLoading &&
          Array.from({ length: 8 }).map((_, i) => <StoreSkeleton key={i} />)}

        {/* STORES */}
        {stores.map((store: any) => (
          <motion.div
            key={store.id}
            onClick={() => router.push(`/stores/${store.user_id}`)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="cursor-pointer group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all"
          >
            {/* BANNER */}
            <div className="relative h-32 bg-gray-100 overflow-hidden">
              {store.store_banner?.url && (
                <Image
                  src={store.store_banner.url}
                  alt={store.name}
                  fill
                  height={200}
                  width={400}
                  className="object-cover group-hover:scale-105 h-full w-full transition-transform duration-300"
                />
              )}
            </div>

            {/* CONTENT */}
            <div className="px-4 pb-4 relative">
              {/* LOGO */}
              <div className="absolute -top-8 left-4 w-16 h-16 rounded-xl border-4 border-white bg-gray-50 overflow-hidden">
                {store.store_logo?.url && (
                  <Image
                    src={store.store_logo.url}
                    alt={store.name}
                    fill
                    className="object-cover"
                  />
                )}
              </div>

              <div className="pt-10">
                <h2 className="font-semibold text-gray-900 truncate">
                  {store.name}
                </h2>

                <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                  {store.store_description || "No description available"}
                </p>

                <p className="text-xs text-gray-400 mt-2">{store.address}</p>

                <span
                  className={`inline-block mt-3 text-xs px-2 py-1 rounded-full ${
                    store.is_active
                      ? "bg-green-100 text-green-600"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {store.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Skeletons (next page loading) */}
        {isFetchingNextPage &&
          Array.from({ length: 4 }).map((_, i) => (
            <StoreSkeleton key={`next-${i}`} />
          ))}
      </div>

      {/* LOAD TRIGGER */}
      <div ref={loadMoreRef} className="h-20" />

      {/* END STATE */}
      {!hasNextPage && !isLoading && (
        <p className="text-center text-sm text-gray-400 mt-10">
          You’ve reached the end
        </p>
      )}
      <Footer />
    </div>
  );
};

export default Stores;

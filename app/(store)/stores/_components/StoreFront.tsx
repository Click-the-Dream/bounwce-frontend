"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import useStore from "@/app/hooks/use-store";
import { Loader2, MapPin, Phone, Mail } from "lucide-react";

const StoreFront = () => {
  const { storeId } = useParams();
  const { useGetStoreInfo } = useStore();

  const { data: store, isLoading } = useGetStoreInfo(storeId);

  const [tab, setTab] = useState<"products" | "about">("products");

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="text-center py-20 text-gray-500">Store not found</div>
    );
  }

  return (
    <div className="pb-20">
      {/* HERO BANNER */}
      <div className="relative h-56 md:h-72 w-full bg-gray-100">
        {store.store_banner?.url && (
          <Image
            src={store.store_banner.url}
            alt={store.name}
            fill
            className="object-cover"
          />
        )}

        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* STORE HEADER */}
      <div className="max-w-6xl mx-auto px-6 -mt-12 relative">
        <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col md:flex-row md:items-center gap-6">
          {/* LOGO */}
          <div className="w-24 h-24 rounded-xl overflow-hidden border-4 border-white bg-white shadow">
            {store.store_logo?.url && (
              <Image
                src={store.store_logo.url}
                alt={store.name}
                width={96}
                height={96}
                className="object-cover"
              />
            )}
          </div>

          {/* INFO */}
          <div className="flex-1">
            <h1 className="text-2xl font-semibold">{store.name}</h1>

            <p className="text-gray-500 text-sm mt-1">
              {store.store_description}
            </p>

            <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <MapPin size={14} /> {store.address}
              </span>
              <span className="flex items-center gap-1">
                <Phone size={14} /> {store.phone_number}
              </span>
              <span className="flex items-center gap-1">
                <Mail size={14} /> {store.email}
              </span>
            </div>
          </div>

          {/* STATUS */}
          <div>
            <span
              className={`text-xs px-3 py-1 rounded-full ${
                store.is_active
                  ? "bg-green-100 text-green-600"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {store.is_active ? "Active Store" : "Inactive"}
            </span>
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-6 mt-8 border-b">
          <button
            onClick={() => setTab("products")}
            className={`pb-3 text-sm font-medium ${
              tab === "products" ? "border-b-2 border-black" : "text-gray-500"
            }`}
          >
            Products
          </button>

          <button
            onClick={() => setTab("about")}
            className={`pb-3 text-sm font-medium ${
              tab === "about" ? "border-b-2 border-black" : "text-gray-500"
            }`}
          >
            About Store
          </button>
        </div>

        {/* TAB CONTENT */}
        <div className="mt-6">
          {tab === "products" && (
            <div className="text-gray-500 text-sm">
              Products will be loaded here (next step: connect store products
              API)
            </div>
          )}

          {tab === "about" && (
            <div className="text-sm text-gray-600 leading-relaxed">
              {store.store_description ||
                "No additional information available."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoreFront;

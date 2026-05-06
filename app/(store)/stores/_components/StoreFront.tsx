"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import useStore from "@/app/hooks/use-store";
import useProduct from "@/app/hooks/use-product";
import { Loader2, MapPin, Phone, Mail } from "lucide-react";
import ProductCard from "@/app/marketplace/_components/ProductCard";

const StoreFront = () => {
  const { storeId } = useParams();

  const { useGetStoreProducts } = useProduct();
  const { useGetStoreInfo } = useStore();

  const { data: store, isLoading } = useGetStoreInfo(storeId);

  const {
    data: products,
    isLoading: productsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetStoreProducts(store?.id);

  // FLATTEN PAGINATED DATA
  const productList =
    products?.pages?.flatMap((page: any) => page.products) || [];

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
      {/* HERO */}
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

      <div className="max-w-6xl mx-auto px-6 -mt-12 relative">
        {/* HEADER */}
        <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col md:flex-row gap-6">
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
        </div>

        {/* TABS */}
        <div className="flex gap-6 mt-8 border-b border-gray-300">
          <button
            onClick={() => setTab("products")}
            className={`pb-3 text-sm ${
              tab === "products" ? "border-b-2 border-black" : "text-gray-500"
            }`}
          >
            Products
          </button>

          <button
            onClick={() => setTab("about")}
            className={`pb-3 text-sm ${
              tab === "about" ? "border-b-2 border-black" : "text-gray-500"
            }`}
          >
            About Store
          </button>
        </div>

        {/* CONTENT */}
        <div className="mt-6">
          {tab === "products" && (
            <>
              {productsLoading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="animate-spin" />
                </div>
              ) : productList.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                  No products available
                </div>
              ) : (
                <>
                  <div className="grid md:grid-cols-auto lg:grid-cols-4 gap-6">
                    {productList.map((product: any) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>

                  {/* LOAD MORE */}
                  {hasNextPage && (
                    <div className="flex justify-center mt-10">
                      <button
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                        className="px-6 py-2 text-sm bg-black text-white rounded-lg disabled:opacity-50"
                      >
                        {isFetchingNextPage ? "Loading..." : "Load More"}
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {tab === "about" && (
            <div className="text-sm text-gray-600">
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

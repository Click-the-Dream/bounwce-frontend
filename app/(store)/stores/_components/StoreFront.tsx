"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import useStore from "@/app/hooks/use-store";
import useProduct from "@/app/hooks/use-product";
import { Loader2, MapPin, Phone, Mail } from "lucide-react";
import ProductCard from "@/app/marketplace/_components/ProductCard";
import SafeImage from "@/app/_components/SafeImage";
import useUser from "@/app/hooks/use-user";

const StoreFront = () => {
  const { storeId } = useParams();

  const { useGetUserById } = useUser();
  const { useGetStoreProducts } = useProduct();
  const { useGetStoreInfo } = useStore();

  const { data: store, isLoading } = useGetStoreInfo(storeId);

  // FETCH VENDOR DETAILS
  const { data: vendor, isLoading: vendorLoading } = useGetUserById(
    store?.user_id,
  );

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
          <SafeImage
            src={store.store_banner.url}
            alt={store.name}
            width={1028}
            height={288}
            className="object-cover h-full w-full"
          />
        )}

        <div className="absolute inset-0 bg-black/30" />
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-12 relative">
        {/* HEADER */}
        <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col md:flex-row gap-6">
          <div className="w-24 h-24 rounded-xl overflow-hidden border-4 border-white bg-white shadow">
            {store.store_logo?.url && (
              <SafeImage
                src={store.store_logo.url}
                alt={store.name}
                width={96}
                height={96}
                className="object-cover h-full w-full"
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
                <Phone size={14} /> {vendor?.phone_number || store.phone_number}
              </span>

              <span className="flex items-center gap-1">
                <Mail size={14} /> {vendor?.email || store.email}
              </span>
            </div>

            {/* VENDOR INFO */}
            <div className="mt-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100">
                {vendor?.profile_picture?.url ? (
                  <SafeImage
                    src={vendor.profile_picture.url}
                    alt={vendor?.full_name || "Vendor"}
                    width={40}
                    height={40}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm font-medium text-gray-500">
                    {vendor?.full_name?.charAt(0) || "V"}
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm text-gray-500">Vendor</p>

                {vendorLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Loader2 size={14} className="animate-spin" />
                    Loading vendor...
                  </div>
                ) : (
                  <h3 className="font-medium text-sm">
                    {vendor?.full_name || "Unknown Vendor"}
                  </h3>
                )}
              </div>
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
            <div className="space-y-6">
              {/* STORE OVERVIEW */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <h3 className="text-base font-semibold text-black mb-3">
                  Store Overview
                </h3>

                <p className="text-sm leading-7 text-gray-600">
                  {store.store_description || "No store description available."}
                </p>
              </div>

              {/* STORE DETAILS */}
              <div className="grid md:grid-cols-2 gap-5">
                {/* CONTACT INFO */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5">
                  <h3 className="text-base font-semibold text-black mb-4">
                    Contact Information
                  </h3>

                  <div className="space-y-4 text-sm">
                    <div className="flex items-start gap-3">
                      <MapPin size={18} className="text-gray-400 mt-0.5" />

                      <div>
                        <p className="text-gray-500">Address</p>
                        <p className="text-black">
                          {store.address || "Not provided"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Phone size={18} className="text-gray-400 mt-0.5" />

                      <div>
                        <p className="text-gray-500">Phone</p>
                        <p className="text-black">
                          {vendor?.phone_number ||
                            store.phone_number ||
                            "Not provided"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Mail size={18} className="text-gray-400 mt-0.5" />

                      <div>
                        <p className="text-gray-500">Email</p>
                        <p className="text-black">
                          {vendor?.email || store.email || "Not provided"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* VENDOR INFO */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5">
                  <h3 className="text-base font-semibold text-black mb-4">
                    Vendor Information
                  </h3>

                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100">
                      {vendor?.profile_picture?.url ? (
                        <SafeImage
                          src={vendor.profile_picture.url}
                          alt={vendor?.full_name || "Vendor"}
                          width={64}
                          height={64}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg font-semibold text-gray-500">
                          {vendor?.full_name?.charAt(0) || "V"}
                        </div>
                      )}
                    </div>

                    <div>
                      <h4 className="font-medium text-black">
                        {vendor?.full_name || "Unknown Vendor"}
                      </h4>

                      <p className="text-sm text-gray-500 mt-1">
                        Verified marketplace vendor
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* STORE STATS */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <h3 className="text-base font-semibold text-black mb-4">
                  Store Statistics
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-gray-100 rounded-xl p-4">
                    <p className="text-2xl font-semibold text-black">
                      {productList.length}
                    </p>

                    <p className="text-sm text-gray-500 mt-1">Products</p>
                  </div>

                  <div className="border border-gray-100 rounded-xl p-4">
                    <p className="text-2xl font-semibold text-black">Active</p>

                    <p className="text-sm text-gray-500 mt-1">Store Status</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoreFront;

"use client";

import { useAuth } from "@/app/context/AuthContext";
import HeroSection from "./_components/HeroSection";
import QuickActions from "./_components/QuickActions";
import ProductGrid from "./_components/ProductGrid";
import HorizontalScroller from "./_components/HorizontalScroller";
import PromoCards from "./_components/PromoCards";
import TrustBar from "./_components/TrustBar";
import TopVendors from "./_components/TopVendors";
import useProduct from "@/app/hooks/use-product";

export default function BuyerHome() {
  const { authDetails } = useAuth();

  const { useGetAllProducts } = useProduct();

  const { data, isFetchingNextPage, fetchNextPage, hasNextPage } =
    useGetAllProducts();

  const products =
    data?.pages?.flatMap((page: any) => page?.products ?? []) ?? [];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-10 py-6 space-y-10">
      <HeroSection name={authDetails?.user?.full_name} />

      <ProductGrid
        title="Recommended for You"
        subtitle="Based on your activity and preferences"
        products={products}
      />

      <TopVendors />

      <HorizontalScroller title="Inspired by Your Recent Activity" />

      {/* <HorizontalScroller title="Recently Viewed Items" /> */}

      <PromoCards />

      <TrustBar />
    </div>
  );
}

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
import HomeDiscovery from "./_components/HomeDiscovery";

export default function BuyerHome() {
  const { authDetails } = useAuth();

  const { useGetAllProducts } = useProduct();

  const {
    data,
    isLoading,
    isError,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useGetAllProducts();

  const products =
    data?.pages?.flatMap((page: any) => page?.products ?? []) ?? [];

  return <HomeDiscovery />;
}

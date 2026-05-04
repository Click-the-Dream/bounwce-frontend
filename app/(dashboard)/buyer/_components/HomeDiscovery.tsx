"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import useInterest from "@/app/hooks/use-interest";
import useMatch from "@/app/hooks/use-match";

import { loadingSteps } from "@/app/_utils/dummy";
import DiscoveryResults from "./discovery/DiscoveryResults";
import { DiscoverySearchBar } from "./discovery/DiscoverySearchBar";

const HomeDiscovery = () => {
  const { useSearchUsers } = useMatch();
  const { useGetUserInterests } = useInterest();

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") || "";

  const { data: userInterests = [] } = useGetUserInterests();

  const [searchValue, setSearchValue] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadingStep, setLoadingStep] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);

  const {
    data,
    isLoading: isSearching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useSearchUsers(urlQuery, 10);

  const searchResults =
    data?.pages?.flatMap((page: any) => page.items || page) || [];

  useEffect(() => {
    if (urlQuery) {
      setHasSearched(true);
    } else {
      setHasSearched(false);
      setCurrentIndex(0);
    }
  }, [urlQuery]);

  useEffect(() => {
    setCurrentIndex(0);
  }, [urlQuery]);

  useEffect(() => {
    if (!urlQuery) return;

    const savedIndex = sessionStorage.getItem(`home:index:${urlQuery}`);
    if (savedIndex) setCurrentIndex(Number(savedIndex));
  }, [urlQuery]);

  useEffect(() => {
    if (!urlQuery) return;

    sessionStorage.setItem(`home:index:${urlQuery}`, String(currentIndex));
  }, [currentIndex, urlQuery]);

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    if (currentIndex < searchResults.length - 3) return;

    fetchNextPage();
  }, [
    currentIndex,
    hasNextPage,
    isFetchingNextPage,
    searchResults.length,
    fetchNextPage,
  ]);

  useEffect(() => {
    if (!isSearching) return;

    const interval = setInterval(() => {
      setLoadingStep((p) => (p + 1) % loadingSteps.length);
    }, 1200);

    return () => clearInterval(interval);
  }, [isSearching]);

  const handleSearch = () => {
    if (!searchValue.trim()) return;

    router.push(`${pathname}?q=${encodeURIComponent(searchValue.trim())}`);
    setSearchValue("");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col px-6 pt-24 pb-4">
      <div className="flex-1 w-full flex flex-col items-center">
        {urlQuery && (
          <div className="flex w-full max-w-2xl items-center gap-2 mb-5">
            <span className="text-xs text-gray-500">Results for</span>

            <span className="px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-600 text-xs font-medium line-clamp-1">
              "{urlQuery}"
            </span>
          </div>
        )}
        {/* HERO */}
        {!hasSearched && (
          <div className="max-w-4xl text-center mb-10">
            <h1 className="text-4xl font-bold text-[#1A1A1A] mb-3">
              Find what’s happening around you
            </h1>
            <p className="text-sm text-gray-600">
              Discover people, places, and experiences near you.
            </p>
          </div>
        )}

        {/* INTEREST TAGS */}
        <div
          className={`flex gap-2 max-w-2xl w-full ${
            hasSearched
              ? "overflow-x-auto justify-start p-2 sticky bottom-23"
              : "flex-wrap justify-center"
          }`}
        >
          {userInterests.map((tag: string, i: number) => (
            <button
              key={i}
              onClick={() => {
                setSearchValue(tag);
                router.push(`${pathname}?q=${tag}`);
              }}
              className="px-4 py-2 bg-white border-[0.83px] border-gray-200 rounded-[10px] text-xs whitespace-nowrap hover:shadow-md transition-all duration-200"
            >
              {tag}
            </button>
          ))}
        </div>

        {/* RESULTS */}
        {hasSearched && (
          <DiscoveryResults
            currentIndex={currentIndex}
            searchResults={searchResults}
            setCurrentIndex={setCurrentIndex}
            isSearching={isSearching}
            loadingStep={loadingStep}
            urlQuery={urlQuery}
          />
        )}
      </div>

      <DiscoverySearchBar
        interests={userInterests}
        searchValue={searchValue}
        setSearchValue={setSearchValue}
        handleSearch={handleSearch}
      />
    </div>
  );
};

export default HomeDiscovery;

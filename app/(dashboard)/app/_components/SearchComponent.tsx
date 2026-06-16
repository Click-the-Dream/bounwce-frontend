"use client";
import { useState, useMemo } from "react";
import { ArrowRight, Search, X } from "lucide-react";
import SearchUser from "./SearchUser";
import useMatch from "@/app/hooks/use-match";
import { SuggestedCandidate } from "@/app/_utils/types/payload";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";

const SearchComponent = () => {
  const router = useRouter();
  const { useGetMatches, useGetSuggestedCandidates } = useMatch();
  const { authDetails } = useAuth();
  const [isFocused, setIsFocused] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { data: matches } = useGetMatches();

  // Handling Infinite Query data structure
  const { data: suggestData } = useGetSuggestedCandidates();

  const handleViewAll = () => {
    setIsFocused(false);
    setSearchTerm("");
    router.push("/app/explore");
  };

  const filteredResults = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    const keywords = query.split(/\s+/);
    const myId = authDetails?.user?.id;

    // Flatten pages for infinite scroll
    const allSuggestions =
      suggestData?.pages.flatMap((page) => page.items) ?? [];

    const matchFilter = (item: any) => {
      const otherUser = item.user.id === myId ? item.target_user : item.user;
      const name = otherUser.full_name?.toLowerCase?.() || "";
      const username = otherUser.username?.toLowerCase?.() || "";
      return keywords.every(
        (word) => name.includes(word) || username.includes(word),
      );
    };

    const suggestionFilter = (item: any) => {
      const name = item.full_name?.toLowerCase?.() || "";
      const username = item.username?.toLowerCase?.() || "";
      return keywords.every(
        (word) => name.includes(word) || username.includes(word),
      );
    };

    return {
      matched: (matches?.items ?? []).filter(matchFilter),
      suggestions: allSuggestions.filter(suggestionFilter),
    };
  }, [searchTerm, matches?.items, suggestData]);

  const isLoading = !matches?.items || !suggestData;

  return (
    <div
      className={`relative w-full max-w-xl mx-auto ${isFocused ? "shadow-[0.53px_solid_#0000001A] border-[0.53px] border-[#0000001A] rounded-[10px] z-100" : ""} transition-all duration-200`}
      style={{}}
    >
      {/* --- SEARCH INPUT FIELD --- */}
      <div className="relative z-20">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9C9C9C] size-4" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Find Anything"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          className="w-full bg-white border-[0.53px] border-[#0000004D] rounded-[10px] py-2 pl-10 pr-4 text-sm focus:outline-none focus:rounded-b-none focus:border-0 focus:border-b focus:pb-3 placeholder:text-[#9C9C9C] transition-all duration-200"
        />
        {(searchTerm || isFocused) && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm("");
              setIsFocused(false);
            }}
            className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[#9C9C9C] bg-gray-100 hover:bg-gray-200 hover:text-black transition-all"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* --- DROPDOWN RESULTS --- */}
      {isFocused && (
        <div className="fixed md:absolute top-0 left-0 min-w-80 w-full max-h-109.75 pt-10 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-y-auto min-h-112.5 transition-all duration-200">
          {isLoading && (
            <div className="text-center py-6 text-sm text-gray-400">
              Loading results...
            </div>
          )}
          <div className="p-4 space-y-6">
            {/* Matched Section */}
            {filteredResults.matched.length > 0 && (
              <section>
                <h4 className="text-[13px] text-[#747474] mb-3 px-3.75">
                  Matched
                </h4>
                <div className="space-y-1 px-6">
                  {filteredResults.matched.map((item: any, idx: number) => {
                    // Extract the user that IS NOT you
                    const partner =
                      item.user.id === authDetails?.user?.id
                        ? { ...item.target_user, user_id: item.target_user?.id }
                        : { ...item.user, user_id: item.user?.id };

                    return (
                      <SearchUser key={item.match_id || idx} item={partner} />
                    );
                  })}
                </div>
              </section>
            )}

            {/* Suggestions Section */}
            {filteredResults.suggestions.length > 0 && (
              <section>
                <h4 className="text-[13px] text-[#747474] mb-3 px-3.75">
                  More Sugggestions
                </h4>
                <div className="space-y-1 px-6">
                  {filteredResults.suggestions.map(
                    (item: SuggestedCandidate, idx: number) => (
                      <SearchUser key={idx} item={item} />
                    ),
                  )}
                </div>
              </section>
            )}

            {/* Empty State */}
            {filteredResults.matched.length === 0 &&
              filteredResults.suggestions.length === 0 && (
                <div className="text-center py-10 text-[13px] text-[#747474]">
                  No results found for "{searchTerm}"
                </div>
              )}
          </div>
          {/* Show "View all results" ONLY if:
       1. We are NOT actively searching (searchTerm is empty)
       2. There is more data to fetch (hasNextPage is true)
    */}
          {!searchTerm && suggestData?.pages[0]?.nextCursor !== null && (
            <button
              onClick={handleViewAll}
              className="w-max mx-auto px-6 py-3  border-t border-gray-100 bg-gray-50 flex items-center justify-center gap-2 text-sm text-black font-medium hover:bg-gray-100 transition-colors"
            >
              View all results
              <ArrowRight className="size-4" />
            </button>
          )}

          {/* Bottom decorative padding as per wireframe */}
          <div className="h-12 border-t border-gray-50 mt-4" />
        </div>
      )}
    </div>
  );
};

export default SearchComponent;

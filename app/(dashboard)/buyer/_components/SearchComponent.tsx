"use client";
import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import SafeImage from "@/app/_components/SafeImage";
import SearchUser from "./SearchUser";
import useMatch from "@/app/hooks/use-match";
import { SuggestedCandidate } from "@/app/_utils/types/payload";

const SearchComponent = () => {
  const { useGetMatches, useGetSuggestedCandidates } = useMatch();
  const [isFocused, setIsFocused] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { data: matches } = useGetMatches();
  const { data: suggestions } = useGetSuggestedCandidates();

  // Memoized filtering logic based on name, handle, or tags
  const filteredResults = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();

    const keywords = query.split(/\s+/);

    const filterFn = (item: any) => {
      const name = item.full_name?.toLowerCase?.() || "";
      const handle = item.handle?.toLowerCase?.() || "";
      const tags =
        item.shared_interests?.map((t: string) => t.toLowerCase()) || [];

      return keywords.every(
        (word) =>
          name.includes(word) ||
          handle.includes(word) ||
          tags.some((tag: string) => tag.includes(word)),
      );
    };

    if (!query) {
      return {
        matched: matches ?? [],
        suggestions: suggestions ?? [],
      };
    }

    return {
      matched: (matches ?? []).filter(filterFn),
      suggestions: (suggestions ?? []).filter(filterFn),
    };
  }, [searchTerm, matches, suggestions]);

  const isLoading = !matches || !suggestions;

  return (
    <div
      className={`relative w-full max-w-xl mx-auto ${isFocused ? "shadow-[0.53px_solid_#0000001A] border-[0.53px] border-[#0000001A] rounded-[10px]" : ""} transition-all duration-200`}
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
      </div>

      {/* --- DROPDOWN RESULTS --- */}
      {isFocused && (
        <div className="fixed md:absolute top-0 left-0 min-w-80 w-full max-h-109.75 pt-10 bg-white border border-gray-200 rounded-xl shadow-2xl z-10 overflow-hidden min-h-112.5 transition-all duration-200">
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
                  {filteredResults.matched.map(
                    (item: SuggestedCandidate, idx: number) => (
                      <SearchUser key={idx} item={item} />
                    ),
                  )}
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
          {/* Bottom decorative padding as per wireframe */}
          <div className="h-12 border-t border-gray-50 mt-4" />
        </div>
      )}
    </div>
  );
};

export default SearchComponent;

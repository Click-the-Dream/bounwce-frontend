import { ArrowLeft, ArrowRight } from "lucide-react";
import { DiscoveryCard } from "./DiscoveryCard";
import { useRouter } from "next/navigation";
import { slugify } from "@/app/_utils/slugify";
import { loadingSteps } from "@/app/_utils/dummy";
interface DiscoveryResultsProps {
  isSearching: boolean;
  currentIndex: number;
  searchResults: any[];
  loadingStep: number;
  urlQuery?: string;
  setCurrentIndex: (index: number) => void;
}
const DiscoveryResults = ({
  currentIndex,
  searchResults,
  setCurrentIndex,
  isSearching,
  loadingStep,
  urlQuery,
}: DiscoveryResultsProps) => {
  const router = useRouter();
  const goToProfile = (user: any) => {
    router.push(`/buyer/profile/${slugify(user.full_name)}_${user.user_id}`);
  };

  const currentUser = searchResults?.[currentIndex];
  const hasNext = currentIndex < searchResults.length - 1;
  const hasPrev = currentIndex > 0;

  return (
    <div className="w-full max-w-2xl space-y-3 mb-5">
      {urlQuery && (
        <div className="flex items-center gap-2 mb-5 sticky top-10 backdrop-blur-2xl">
          <span className="text-xs text-gray-500">Results for</span>

          <span className="px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-600 text-xs font-medium line-clamp-1">
            "{urlQuery}"
          </span>
        </div>
      )}
      {/* LOADING */}
      {isSearching && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-2">Bouwnce AI</p>

          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce delay-75" />
              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce delay-150" />
            </div>

            <span className="text-sm text-gray-700">
              {loadingSteps[loadingStep]}
            </span>
          </div>
        </div>
      )}

      {/* EMPTY */}
      {!isSearching && !currentUser && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-sm">
          No matches found for "{urlQuery}"
        </div>
      )}

      {/* CARD */}
      {!isSearching && currentUser && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5">
          <p className="text-[11px] text-gray-500 mb-3">Suggested connection</p>

          {/* MAIN LAYOUT */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4">
            {/* LEFT */}
            <DiscoveryCard currentUser={currentUser} />

            {/* ACTION */}
            <button
              onClick={() => goToProfile(currentUser)}
              className=" w-full sm:w-auto mt-2 sm:mt-0 text-xs md:text-[13px] px-3 py-2  bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition cursor-pointer"
            >
              View profile
            </button>
          </div>

          {/* NAV */}
          <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
            <button
              onClick={() => hasPrev && setCurrentIndex(currentIndex - 1)}
              disabled={!hasPrev}
              className="cursor-pointer flex items-center gap-1 text-xs text-gray-500 disabled:opacity-30"
            >
              <ArrowLeft className="w-3 h-3" />
              Prev
            </button>

            <span className="text-[10px] text-gray-400">
              {currentIndex + 1} / {searchResults.length}
            </span>

            <button
              onClick={() => hasNext && setCurrentIndex(currentIndex + 1)}
              disabled={!hasNext}
              className="cursor-pointer flex items-center gap-1 text-xs text-orange-600 disabled:opacity-30"
            >
              Next
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscoveryResults;

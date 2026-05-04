import { ArrowLeft, ArrowRight } from "lucide-react";

interface DiscoveryCardProps {
  currentUser: {
    full_name: string;
    score: number;
    distance_km: number;
    shared_interests: string[];
  };
}
export const DiscoveryCard = ({ currentUser }: DiscoveryCardProps) => {
  return (
    <div className="flex-1 min-w-0">
      <p className="text-sm sm:text-base font-semibold text-gray-900 truncate">
        {currentUser.full_name}
      </p>

      <p className="text-xs text-gray-500 mt-1">
        {Math.round(currentUser.score * 100)}% match ·{" "}
        {currentUser.distance_km > 0
          ? `${currentUser.distance_km.toFixed(1)}km away`
          : "Nearby"}
      </p>

      {/* INTERESTS */}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {currentUser.shared_interests?.slice(0, 3).map((i: string) => (
          <span
            key={i}
            className="text-[10px] sm:text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600"
          >
            {i}
          </span>
        ))}
      </div>
    </div>
  );
};

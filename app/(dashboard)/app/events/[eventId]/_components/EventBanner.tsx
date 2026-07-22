import { CustomMapPinIcon } from "@/app/_utils/CustomIcons";
import { handleShare } from "@/app/_utils/formatters";
import { Share2, Video } from "lucide-react";
import Link from "next/link";

const EventBanner = ({ eventData }: any) => {
  return (
    <div className="group relative h-60 overflow-hidden rounded-[10px] shadow-lg text-white">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-110"
        style={{
          backgroundImage: `url(${eventData.banner_url})`,
        }}
      />

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-linear-to-b from-black/20 via-black/35 to-black/85" />

      {/* Badge */}
      <span className="absolute left-2 top-2 z-10 rounded-md border border-white/40 bg-white/20 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider backdrop-blur-sm transition-colors duration-300 group-hover:bg-white/30">
        Upcoming
      </span>

      {/* Share Button */}
      <button
        onClick={() => handleShare(eventData)}
        className="absolute right-4.5 top-4 z-50 rounded-full bg-black/40 p-2 backdrop-blur-md transition-all duration-300 hover:scale-110 hover:bg-black/60"
      >
        <Share2 size={16} />
      </button>

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col justify-end p-4.5 pb-5.5">
        <h2 className="text-2xl font-irish font-bold tracking-wide transition-transform duration-300 group-hover:translate-y-0.5">
          {eventData.name}
        </h2>

        {eventData.location_type === "physical" ? (
          <div className="mt-1 flex items-center gap-1 text-xs font-medium">
            <CustomMapPinIcon />
            <span className="line-clamp-1 capitalize">
              {eventData.location && eventData.location !== "string"
                ? eventData.location
                : "Physical Event"}
            </span>
          </div>
        ) : (
          <div className="mt-1 flex items-center gap-1 text-xs font-medium">
            <Video size={16} className="shrink-0" />
            {eventData.link && eventData.link !== "string" ? (
              <Link
                href={
                  eventData.link.startsWith("http")
                    ? eventData.link
                    : `https://${eventData.link}`
                }
                target="_blank"
                className="line-clamp-1 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                Virtual Event
              </Link>
            ) : (
              <span>Virtual Event</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventBanner;

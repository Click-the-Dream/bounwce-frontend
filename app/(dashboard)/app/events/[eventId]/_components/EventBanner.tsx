import { CustomMapPinIcon } from "@/app/_utils/CustomIcons";
import { Share2, Video } from "lucide-react";
import Link from "next/link";

const EventBanner = ({ eventData }: any) => {
  return (
    <div
      className="relative rounded-[10px] overflow-hidden shadow-lg h-60 bg-cover bg-center flex flex-col justify-between p-4.75 pb-0 text-white"
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.85)), url(${eventData.banner_url})`,
      }}
    >
      <span className="absolute top-2 left-2 bg-white/20 backdrop-blur-xs border border-white/40 text-white text-[10px] font-medium tracking-wider px-2.5 py-1 rounded-md uppercase transition-all duration-300 group-hover:bg-white/30">
        Upcoming
      </span>{" "}
      {/* Top Right Share Overlay */}
      <button className="absolute top-4 right-4.75 p-2 bg-black/40 backdrop-blur-md text-white rounded-full hover:bg-black/60 transition">
        <Share2 size={16} />
      </button>
      {/* Bottom Location Label */}
      <div className="mt-auto mb-5.5">
        <h2 className="text-2xl font-irish font-bold tracking-wide">
          {eventData.name}
        </h2>

        {eventData.location_type === "physical" ? (
          <div className="flex items-center text-xs font-medium gap-1">
            <CustomMapPinIcon />
            <span className="capitalize line-clamp-1">
              {eventData.location && eventData.location !== "string"
                ? eventData.location
                : "Physical Event"}
            </span>
          </div>
        ) : (
          <div className="flex items-center text-xs font-medium gap-1">
            <Video size={16} className="shrink-0 " />
            {eventData.link && eventData.link !== "string" ? (
              <Link
                href={
                  eventData.link.startsWith("http")
                    ? eventData.link
                    : `https://${eventData.link}`
                }
                target="_blank"
                className="hover:underline line-clamp-1"
                onClick={(e) => e.stopPropagation()}
              >
                Virtual Event
              </Link>
            ) : (
              <span className="capitalize">Virtual Event</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventBanner;

import { Edit3, Copy, Share2, Trash2, Video } from "lucide-react";
import { CustomCalendarIcon, CustomMapPinIcon } from "@/app/_utils/CustomIcons";
import { Event } from "@/app/_utils/types/event";
import { formatEventDate } from "@/app/_utils/date";
import Link from "next/link";
import { handleShare } from "@/app/_utils/formatters";
import SafeImage from "@/app/_components/SafeImage";

const Banner = ({ event }: { event: Event }) => {
  return (
    <div className="bg-white rounded-[10px] border border-gray-200 overflow-hidden mb-6 shadow-sm">
      {/* Banner Image Area */}
      <div className="relative h-36 bg-black overflow-hidden group">
        {event.banner_url && (
          <SafeImage
            src={event.banner_url}
            alt={event.name}
            width={600}
            height={300}
            className="w-full h-full object-cover opacity-60 transition-all duration-500 ease-out group-hover:scale-105 group-hover:opacity-70"
          />
        )}

        <div className="absolute inset-0 bg-black/20 transition-colors duration-500 group-hover:bg-black/35" />

        <div className="absolute top-3.25 left-4">
          <span className="bg-white/26 border-[0.2px] border-white/50 backdrop-blur-xs text-white text-xs tracking-wider px-2.5 py-1 rounded-[50px] uppercase">
            UPCOMING
          </span>
        </div>
        <div className="absolute top-4 right-4">
          <button
            onClick={() => handleShare(event)}
            className="bg-white/26 text-white p-2 rounded-full hover:bg-white/30 transition-colors"
          >
            <Share2 className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>

      {/* Title & Actions Bar */}
      <div className="py-5 px-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1
            title={event.name}
            className="font-irish text-2xl font-bold text-black line-clamp-2 leading-tight"
          >
            {event.name}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-[13px] text-black mt-2">
            <span className="flex items-center gap-1">
              <CustomCalendarIcon />
              {formatEventDate(event.date)}
            </span>
            {event.location_type === "physical" ? (
              <div className="flex items-center gap-1">
                <CustomMapPinIcon />
                <span className="line-clamp-1 capitalize">
                  {event.location && event.location !== "string"
                    ? event.location
                    : "Physical Event"}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <Video size={16} className="shrink-0" />
                {event.link && event.link !== "string" ? (
                  <Link
                    href={
                      event.link.startsWith("http")
                        ? event.link
                        : `https://${event.link}`
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

        <div className="flex items-center gap-2 flex-wrap">
          <button className="cursor-pointer flex items-center gap-1 border-[0.53px] border-gray-300 text-gray-700 px-1.5 py-0.75 rounded-md text-xs hover:bg-gray-50 transition-colors">
            <Edit3 className="w-1.75 h-1.75" /> Edit
          </button>
          <button className="cursor-pointer flex items-center gap-1 border-[0.53px] border-gray-300 text-gray-700 px-1.5 py-0.75 rounded-md text-xs hover:bg-gray-50 transition-colors">
            <Copy className="w-1.75 h-1.75" /> Duplicate
          </button>
          <button className="cursor-pointer flex items-center gap-1 border-[0.53px] border-gray-300 text-gray-700 px-1.5 py-0.75 rounded-md text-xs hover:bg-gray-50 transition-colors">
            <Share2 className="w-1.75 h-1.75" /> Share
          </button>
          <button className="cursor-pointer flex items-center gap-1 border-[0.53px] border-red-300 text-red-600 px-1.5 py-0.75 rounded-md text-xs hover:bg-red-50 transition-colors">
            <Trash2 className="w-1.75 h-1.75" /> Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default Banner;

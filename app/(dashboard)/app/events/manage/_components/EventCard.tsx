import { CustomCalendarIcon, CustomMapPinIcon } from "@/app/_utils/CustomIcons";
import { formatEventDate } from "@/app/_utils/date";
import { Event } from "@/app/_utils/types/event";
import { BarChart3, SquarePen } from "lucide-react";
import Link from "next/link";

const EventCard = ({ event }: { event: Event }) => {
  return (
    <div className="bg-white rounded-[10px] border border-gray-100 shadow-[0_0px_19.1px_0px_#00000040] overflow-hidden flex flex-col transition duration-200">
      {/* Header Banner Content Area */}
      <div className="relative h-12 w-full bg-blue-900">
        <div
          className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-50"
          style={{
            backgroundImage: `url(${event.banner_url})`,
          }}
        />

        <div className="absolute inset-0 bg-linear-to-r from-blue-700/30 to-indigo-900/30 flex items-center justify-center">
          <span className="text-center text-white text-3xl font-extrabold tracking-widest opacity-25 uppercase select-none line-clamp-1">
            {event.name}
          </span>
        </div>

        {/* Badges Overlay */}
        <span className="absolute top-2 left-2 bg-white/20 backdrop-blur-xs border border-white/40 text-white text-[10px] font-medium tracking-wider px-2.5 py-1 rounded-md uppercase transition-all duration-300 group-hover:bg-white/30">
          {event.state}
        </span>

        <Link
          href={`/app/events/${event.id}/edit`}
          className="absolute top-3 right-3 text-white/80 hover:text-white transition cursor-pointer"
        >
          <SquarePen size={14} />
        </Link>
      </div>

      {/* Inner Metadata Area */}
      <div className="p-2 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-medium text-black tracking-tight mb-2 line-clamp-1">
            {event.name}
          </h3>

          {/* Subtitle Rows Info Group */}
          <div className="space-x-4 mb-2 flex gap-1 flex-wrap items-center">
            <div className="flex items-center text-xs text-[#FF5A5F] font-medium gap-1">
              <CustomCalendarIcon />
              <span className="text-gray-400">
                {formatEventDate(event.date)}
              </span>
            </div>
            <div className="flex items-center text-xs text-purple-700 font-medium gap-1">
              <CustomMapPinIcon />
              <span className="text-gray-400 line-clamp-1">
                {event.location}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Boundary Row Analytics Box */}
        <div className="border-t-[0.53px] border-dashed border-[#BEBEBE] pt-3 mt-auto flex items-end justify-between">
          <div className="grid grid-cols-2 gap-x-8 gap-y-0.5">
            <div>
              <div className="text-[13px] font-medium text-gray-900 leading-none">
                {0}
              </div>
              <div className="text-[13px] text-gray-400 uppercase mt-0.5">
                Sign ups:
              </div>
            </div>
            <div>
              <div className="text-[13px] font-medium text-gray-900 leading-none">
                {0}
              </div>
              <div className="text-[13px] text-gray-400 uppercase mt-0.5">
                Revenue:
              </div>
            </div>
          </div>

          {/* Bar analytics vector mini logo style graphic */}
          <div className="text-gray-400 mb-0.5">
            <BarChart3
              size={15}
              className="rotate-0 text-gray-700"
              strokeWidth={2}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCard;

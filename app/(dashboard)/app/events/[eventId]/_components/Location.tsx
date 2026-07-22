import { CustomLocationIcon } from "@/app/_utils/CustomIcons";
import { Event } from "@/app/_utils/types/event";
import { ExternalLink, MapPin, Video } from "lucide-react";

const Location = ({ eventData }: { eventData: Event }) => {
  return (
    <div className="mt-10 min-h-22.25">
      <h2 className="text-sm font-medium text-black">
        {eventData.location_type === "physical" ? "Location" : "Meeting Link"}
      </h2>

      <div className="mt-7.5 border-[0.53px] border-[#00000033] rounded-[10px] overflow-hidden flex flex-col md:flex-row group transition-all duration-300 hover:border-orange-200 hover:shadow-md">
        {/* Left */}
        <div className="w-full md:w-1/3 p-5 bg-gray-200 relative flex items-center justify-center border-b md:border-b-0 md:border-r border-gray-200/60 transition-all duration-300 group-hover:bg-orange-50">
          <div className="flex items-center justify-center">
            {eventData.location_type === "physical" ? (
              <CustomLocationIcon />
            ) : (
              <Video
                size={20}
                className="text-orange transition-transform duration-300 group-hover:scale-110"
              />
            )}
          </div>
        </div>

        {/* Right */}
        <div className="p-4 md:p-5 flex flex-col justify-center transition-transform duration-300 group-hover:translate-x-1">
          {eventData.location_type === "physical" ? (
            <>
              <h3 className="text-[13px] font-semibold text-black">
                {eventData.location}
              </h3>

              {/* {eventData.address && (
            <p className="text-[13px] text-gray-500">
              {eventData.address}
            </p>
          )} */}

              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(
                  eventData.location,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-orange hover:underline mt-1 transition-all duration-200 hover:gap-2"
              >
                Get Direction
                <ExternalLink size={13} />
              </a>
            </>
          ) : (
            <>
              <h3 className="text-[13px] font-semibold text-black">
                Virtual Event
              </h3>

              <p className="text-[13px] text-gray-500 line-clamp-2">
                {eventData.link && eventData.link !== "string"
                  ? eventData.link
                  : "Meeting link will be shared before the event starts."}
              </p>

              {eventData.link && eventData.link !== "string" && (
                <a
                  href={
                    eventData.link.startsWith("http")
                      ? eventData.link
                      : `https://${eventData.link}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-orange hover:underline mt-1"
                >
                  Join Meeting
                  <ExternalLink size={13} />
                </a>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Location;

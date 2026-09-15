"use client";

import { CustomCalendarIcon, CustomMapPinIcon } from "@/app/_utils/CustomIcons";
import { formatEventDate } from "@/app/_utils/date";
import { Event } from "@/app/_utils/types/event";
import useEvents from "@/app/hooks/use-events";
import { BarChart3, SquarePen, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const EventCard = ({ event }: { event: Event }) => {
  const router = useRouter();
  const { deleteEvent } = useEvents();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteEvent.mutateAsync(event.id);
      setShowDeleteModal(false);
      router.refresh();
    } catch (error) {
      console.error("Failed to delete event:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="cursor-pointer group bg-white rounded-[10px] border border-gray-100 shadow-[0_0px_19.1px_0px_#00000040] overflow-hidden flex flex-col transition duration-200">
        {/* Header Banner Content Area */}
        <div className="relative h-12 w-full bg-blue-900">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${event.banner_url})`,
            }}
          />

          <div className="absolute inset-0 bg-linear-to-r from-blue-700/60 to-indigo-900/60 flex items-center justify-center">
            <span className="text-center text-white text-3xl font-extrabold tracking-widest opacity-25 uppercase select-none line-clamp-1">
              {event.name}
            </span>
          </div>

          {/* State Badge */}
          <span className="absolute top-2 left-2 bg-white/20 backdrop-blur-xs border border-white/40 text-white text-[10px] font-medium tracking-wider px-2.5 py-1 rounded-md uppercase transition-all duration-300 group-hover:bg-white/30">
            {event.state}
          </span>

          {/* Actions */}
          <div className="absolute top-2 right-2 flex items-center gap-2">
            <Link
              href={`/app/events/${event.id}/edit`}
              onClick={(e) => e.stopPropagation()}
              className="text-white/80 hover:text-white transition cursor-pointer"
              aria-label="Edit event"
            >
              <SquarePen size={14} />
            </Link>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteModal(true);
              }}
              className="text-white/80 hover:text-red-300 transition cursor-pointer"
              aria-label="Delete event"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Inner Metadata Area */}
        <div
          onClick={() => router.push(`/app/events/manage/${event.id}`)}
          className="p-2 flex-1 flex flex-col justify-between"
        >
          <div>
            <h3 className="text-sm font-medium text-black group-hover:text-orange tracking-tight mb-2 line-clamp-1">
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-2"
          onClick={() => !isDeleting && setShowDeleteModal(false)}
        >
          <div
            className="w-full max-w-80 rounded-2xl bg-white p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                <Trash2 size={16} />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Delete event?
                </h2>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Are you sure you want to delete{" "}
                  <span className="font-medium text-gray-800">
                    "{event.name}"
                  </span>
                  ? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="mt-2 flex justify-end gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteModal(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete event"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EventCard;

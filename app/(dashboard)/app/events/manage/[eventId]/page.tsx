"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import BackBtn from "../../_components/BackBtn";
import Banner from "./_components/Banner";
import Metrics from "./_components/Metrics";
import { useParams } from "next/navigation";
import useEvents from "@/app/hooks/use-events";
import AttendanceList from "./_components/AttendanceList";
import DashboardSkeleton from "./_components/DashboardSkeleton";

export default function EventDashboard() {
  const { eventId } = useParams<{ eventId: string }>();
  const { useGetEvent } = useEvents();

  const {
    data: eventData,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetEvent(eventId);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (isError) {
    return (
      <div className="w-full max-w-195 bg-transparent mx-auto min-h-[60vh] px-4 py-8 flex flex-col items-center justify-center text-center">
        <div className="p-3 bg-red-100 rounded-full text-red-600 mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Failed to load event
        </h2>
        <p className="text-sm text-gray-500 max-w-md mb-6">
          {error?.message ||
            "Something went wrong while fetching the event details. Please try again."}
        </p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" /> Try Again
        </button>
      </div>
    );
  }

  if (!eventData) {
    return (
      <div className="w-full max-w-195 mx-auto px-4 py-12 text-center text-gray-500">
        Event not found.
      </div>
    );
  }

  return (
    <div className="w-full max-w-195 bg-transparent mx-auto min-h-screen px-4 py-8 md:px-6 text-gray-800 font-sans border-l-[0.53px] border-r-[0.53px] mb-5 border-[#00000033]">
      <div className="mb-6">
        <BackBtn text="Back to manage event" />
      </div>

      <Banner event={eventData} />

      <Metrics />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 bg-white px-4 py-3 rounded-[10px] border-[0.3px] border-black/20 flex flex-col">
          <h2 className="font-semibold text-gray-800 mb-10">Breakdown</h2>

          <div className="flex items-center justify-around gap-4">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg
                className="w-full h-full transform -rotate-90"
                viewBox="0 0 36 36"
              >
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#E5E7EB"
                  strokeWidth="3.8"
                />
                {/* Regular (Green) - 48% */}
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#16A34A"
                  strokeWidth="3.8"
                  strokeDasharray="48, 100"
                />
                {/* VIP (Blue) - 30% */}
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="3.8"
                  strokeDasharray="30, 100"
                  strokeDashoffset="-48"
                />
                {/* VVIP (Orange) - 14% */}
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="3.8"
                  strokeDasharray="14, 100"
                  strokeDashoffset="-78"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-base font-bold text-black leading-none">
                  400
                </span>
                <span className="text-[10px] text-gray-500 font-medium tracking-wide">
                  SOLD
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-2.5">
                <span className="w-3.5 h-3.5 rounded-full bg-green-600 mt-1 shrink-0" />
                <div>
                  <p className="font-semibold text-xs text-black leading-tight">
                    Regular
                  </p>
                  <p className="text-xs text-gray-500">250 - 48%</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-3.5 h-3.5 rounded-full bg-blue-600 mt-1 shrink-0" />
                <div>
                  <p className="font-semibold text-xs text-black leading-tight">
                    VIP
                  </p>
                  <p className="text-xs text-gray-500">100 - 30%</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-3.5 h-3.5 rounded-full bg-amber-500 mt-1 shrink-0" />
                <div>
                  <p className="font-semibold text-xs text-black leading-tight">
                    VVIP
                  </p>
                  <p className="text-xs text-gray-400">40 - 14%</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Attendee List Table */}
        <AttendanceList eventId={eventId} />
      </div>
    </div>
  );
}

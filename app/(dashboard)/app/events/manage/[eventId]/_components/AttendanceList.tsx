"use client";

import useEvents from "@/app/hooks/use-events";
import { Download } from "lucide-react";

const AttendanceList = ({ eventId }: { eventId: string }) => {
  const { useEventAttendees } = useEvents();
  const { data, isLoading, isError, error } = useEventAttendees(eventId);

  const attendees = data?.data ?? data ?? [];

  return (
    <div className="lg:col-span-3 bg-white p-4.5 rounded-[10px] border-[0.3px] border-black/20">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-[13px] font-medium text-gray-800">Attendee List</h2>

        <button
          className="flex items-center gap-1.5 border-[0.53px] border-black/60 text-black px-1.75 py-1.25 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
          disabled={attendees.length === 0}
        >
          <Download className="w-3 h-3" />
          Export
        </button>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="py-12 text-center text-sm text-gray-500">
          Loading attendees...
        </div>
      ) : isError ? (
        <div className="py-12 text-center">
          <p className="text-sm text-red-500">
            {error instanceof Error
              ? error.message
              : "Failed to load attendees."}
          </p>
        </div>
      ) : attendees.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-500">
          No attendees yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-[0.53px] border-black/30 text-xs font-medium text-black">
                <th className="pb-2.5 pr-4">Name</th>
                <th className="pb-2.5 px-4">Email</th>
                <th className="pb-2.5 pl-4 text-right">Ticket</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 text-[13px]">
              {attendees.map((attendee: any) => (
                <tr key={attendee.id} className="text-gray-700">
                  <td className="py-2 pr-4 font-medium text-black">
                    {attendee.name}
                  </td>

                  <td className="py-2 px-4 text-gray-500">{attendee.email}</td>

                  <td className="py-2 pl-4 text-right font-medium text-black">
                    {attendee?.ticket_info[0]?.ticket_name}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AttendanceList;

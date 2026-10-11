"use client";

import { useEffect } from "react";
import { Calendar, Clock, ExternalLink, MapPin, Video, X } from "lucide-react";
import { EventFormInputs } from "@/app/_utils/utility";
import { formatEventDate, formatEventTime } from "@/app/_utils/date";

interface EventPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventData: Partial<EventFormInputs>;
  bannerPreview: string | null;
}

const formatPrice = (price: string | number | undefined) => {
  if (price === undefined || price === null || String(price).trim() === "") {
    return "Price not set";
  }

  const amount = Number(price);
  if (!Number.isFinite(amount)) return String(price);
  if (amount === 0) return "Free";
  return `₦${amount.toLocaleString("en-NG", { maximumFractionDigits: 2 })}`;
};

export default function EventPreviewModal({
  isOpen,
  onClose,
  eventData,
  bannerPreview,
}: EventPreviewModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const name = eventData.name?.trim() || "Your event title";
  const description = eventData.desc?.trim();
  const interests = eventData.interests ?? [];
  const tickets = eventData.ticket_info ?? [];
  const dateIsValid = Boolean(
    eventData.date && !Number.isNaN(new Date(eventData.date).getTime()),
  );
  const eventDate = dateIsValid
    ? formatEventDate(eventData.date!)
    : "Date not set";
  const eventTime =
    dateIsValid && eventData.date?.includes("T")
      ? formatEventTime(eventData.date)
      : "Time not set";
  const isPhysical = eventData.location_type?.toLowerCase() === "physical";
  const isVirtual = eventData.location_type?.toLowerCase() === "virtual";
  const location = isPhysical
    ? eventData.location?.trim()
    : eventData.link?.trim();

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/55 p-2 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-preview-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[96vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-[#ECECF0] shadow-2xl">
        <div className="z-10 flex shrink-0 items-center justify-between gap-4 border-b border-black/10 bg-white px-4 py-2 sm:px-6">
          <div className="min-w-0 leading-tight">
            <p className="text-[10px] font-semibold uppercase text-orange">
              Event preview
            </p>
            <p
              id="event-preview-title"
              className="truncate text-sm font-semibold text-gray-900"
            >
              {name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close event preview"
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 overflow-y-auto">
          <main className="mx-auto w-full max-w-6xl px-4 py-5 text-black sm:px-6 sm:py-7">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
              <section className="space-y-5 lg:col-span-2">
                <div className="group relative h-60 overflow-hidden rounded-[10px] bg-gray-300 text-white shadow-lg">
                  {bannerPreview ? (
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url("${bannerPreview}")` }}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-linear-to-br from-gray-500 via-gray-700 to-gray-950" />
                  )}
                  <div className="absolute inset-0 bg-linear-to-b from-black/20 via-black/35 to-black/85" />
                  <span className="absolute left-3 top-3 z-10 rounded-md border border-white/40 bg-white/20 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider backdrop-blur-sm">
                    Preview · Not published
                  </span>
                  <div className="relative z-10 flex h-full flex-col justify-end p-4 pb-5 sm:p-5">
                    <h2 className="wrap-break-word text-2xl font-bold tracking-wide sm:text-3xl">
                      {name}
                    </h2>
                    <div className="mt-2 flex items-center gap-1.5 text-xs font-medium">
                      {isPhysical ? (
                        <>
                          <MapPin size={15} className="shrink-0" />
                          <span className="line-clamp-1">
                            {location || "Event location not set"}
                          </span>
                        </>
                      ) : isVirtual ? (
                        <>
                          <Video size={15} className="shrink-0" />
                          <span>Virtual event</span>
                        </>
                      ) : (
                        <span>Location not set</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="flex min-h-25 flex-col justify-between rounded-[10px] border border-black/15 bg-white p-4">
                    <Calendar
                      size={18}
                      className="mb-3 text-gray-500"
                      strokeWidth={1.4}
                    />
                    <div>
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-800">
                        Date
                      </p>
                      <p className="text-xs text-gray-500">{eventDate}</p>
                    </div>
                  </div>
                  <div className="flex min-h-25 flex-col justify-between rounded-[10px] border border-black/15 bg-white p-4">
                    <Clock
                      size={18}
                      className="mb-3 text-gray-500"
                      strokeWidth={1.4}
                    />
                    <div>
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-800">
                        Time
                      </p>
                      <p className="text-xs text-gray-500">
                        {eventTime || "Time not set"}
                      </p>
                    </div>
                  </div>
                  <div className="flex min-h-25 flex-col justify-between rounded-[10px] border border-black/15 bg-white p-4">
                    <span className="mb-3 text-lg text-gray-500">◎</span>
                    <div>
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-800">
                        Attending
                      </p>
                      <p className="text-xs text-gray-500">
                        Shown after publishing
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[10px] border border-black/10 bg-white p-4 sm:p-5">
                  <h3 className="text-base font-medium text-black">
                    About this event
                  </h3>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 tracking-wide text-gray-600">
                    {description || "Your event description will appear here."}
                  </p>
                  {interests.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-4">
                      {interests.map((interest, index) => (
                        <span
                          key={`${interest}-${index}`}
                          className="rounded-[5px] bg-[#EFEFEF] px-2.5 py-1 text-xs font-medium capitalize text-orange"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-[10px] border border-black/10 bg-white p-4 sm:p-5">
                  <h3 className="text-sm font-medium text-black">
                    {isPhysical ? "Location" : "Meeting link"}
                  </h3>
                  <div className="mt-4 flex flex-col overflow-hidden rounded-[10px] border border-black/10 sm:flex-row">
                    <div className="flex min-h-24 items-center justify-center border-b border-black/10 bg-gray-100 p-5 sm:w-1/3 sm:border-b-0 sm:border-r">
                      {isPhysical ? (
                        <MapPin size={23} className="text-orange" />
                      ) : (
                        <Video size={23} className="text-orange" />
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-center p-4">
                      <p className="wrap-break-word text-[13px] font-semibold text-black">
                        {isPhysical
                          ? location || "Event address not set"
                          : isVirtual
                            ? "Virtual event"
                            : "Location type not selected"}
                      </p>
                      {isPhysical && location ? (
                        <a
                          href={`https://maps.google.com/?q=${encodeURIComponent(location)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-xs text-orange hover:underline"
                        >
                          Get direction <ExternalLink size={12} />
                        </a>
                      ) : isVirtual && location ? (
                        <a
                          href={
                            location.startsWith("http")
                              ? location
                              : `https://${location}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-flex items-center gap-1 break-all text-xs text-orange hover:underline"
                        >
                          Open meeting link <ExternalLink size={12} />
                        </a>
                      ) : (
                        <p className="mt-1 text-xs text-gray-500">
                          {isVirtual
                            ? "The meeting link will appear here when provided."
                            : "Add a location in the event form to complete this section."}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              <aside className="space-y-3">
                <div className="rounded-[10px] border border-black/10 bg-white p-4 pt-5 shadow-sm">
                  <div className="rounded-full bg-gray-900 px-4 py-3 text-center text-xs font-semibold text-white">
                    Preview mode
                  </div>
                  <p className="mt-3 text-center text-xs leading-5 text-gray-500">
                    Ticket purchases and attendance become available after the
                    event is published.
                  </p>
                  <div className="mt-4 border-t border-black/10 pt-4">
                    <h3 className="text-xs font-semibold text-gray-900">
                      Ticket options
                    </h3>
                    {tickets.length ? (
                      <div className="mt-3 space-y-2">
                        {tickets.map((ticket, index) => (
                          <div
                            key={`${ticket.ticket_name}-${index}`}
                            className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5"
                          >
                            <span className="min-w-0 truncate text-xs font-medium text-gray-700">
                              {ticket.ticket_name || "Ticket"}
                            </span>
                            <span className="shrink-0 text-xs font-semibold text-gray-900">
                              {formatPrice(ticket.price)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-gray-500">
                        No ticket options selected yet.
                      </p>
                    )}
                  </div>
                </div>
                <div className="rounded-[10px] border border-black/10 bg-white p-4">
                  <p className="text-xs font-semibold text-gray-900">
                    Ready to make changes?
                  </p>
                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    Close this preview to return to the form. Your current
                    entries will remain in place.
                  </p>
                  <button
                    type="button"
                    onClick={onClose}
                    className="mt-4 w-full rounded-full bg-black px-4 py-3 text-xs font-semibold text-white transition hover:bg-gray-800"
                  >
                    Back to editing
                  </button>
                </div>
              </aside>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

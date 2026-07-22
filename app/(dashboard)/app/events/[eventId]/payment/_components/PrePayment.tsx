"use client";
import { useEffect, useState } from "react";
import { Users, Video } from "lucide-react";
import { CustomCalendarIcon, CustomMapPinIcon } from "@/app/_utils/CustomIcons";
import { useParams } from "next/navigation";
import { TicketInfo } from "@/app/_utils/types/event";
import { formatEventTime } from "@/app/_utils/date";
import Link from "next/link";
import useEvent from "@/app/hooks/use-events";
import TicketCard from "./TicketCard";

export default function PrePayment() {
  const { eventId } = useParams<{ eventId: string }>();
  const { useGetEvent } = useEvent();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const {
    data: event = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useGetEvent(eventId);
  const ticketCategories: TicketInfo[] = event.ticket_info ?? [];

  useEffect(() => {
    if (!ticketCategories.length) return;

    const firstTicket = ticketCategories[0].ticket_name;

    setSelectedCategoryId(firstTicket);

    setQuantities(
      Object.fromEntries(
        ticketCategories.map((ticket) => [
          ticket.ticket_name,
          ticket.ticket_name === firstTicket ? 1 : 0,
        ]),
      ),
    );
  }, [ticketCategories]);

  const handleSelectCategory = (ticketName: string) => {
    setSelectedCategoryId(ticketName);

    setQuantities((prev) => {
      const next: Record<string, number> = {};

      ticketCategories.forEach((ticket) => {
        next[ticket.ticket_name] =
          ticket.ticket_name === ticketName
            ? Math.max(prev[ticket.ticket_name] || 1, 1)
            : 0;
      });

      return next;
    });
  };

  const updateQuantity = (ticketName: string, amount: number) => {
    setQuantities((prev) => ({
      ...prev,
      [ticketName]: Math.max(
        ticketName === selectedCategoryId ? 1 : 0,
        (prev[ticketName] || 0) + amount,
      ),
    }));
  };

  const activeCategory = ticketCategories.find(
    (ticket) => ticket.ticket_name === selectedCategoryId,
  );

  const activeQty = quantities[selectedCategoryId] || 0;
  const subtotal = (activeCategory?.price ?? 0) * activeQty;
  const serviceFee = Math.round(subtotal * 0.05);
  const total = subtotal + serviceFee;

  const formatCurrency = (value: number) => {
    return "₦" + value.toLocaleString("en-NG");
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        Loading event...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-red-500">
          {(error as Error).message || "Unable to load event"}
        </p>

        <button
          onClick={() => refetch()}
          className="rounded-lg bg-black px-5 py-2 text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        Event not found.
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* Page Title Header */}
      <div className="my-8">
        <h1 className="text-2xl font-medium tracking-tight text-black">
          Get Ticket
        </h1>
        <p className="text-[13px] text-gray-700 font-medium mt-1">
          {event.name} • {event.location_type}
        </p>
      </div>

      {/* Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column - Event Card & Categories */}
        <div className="lg:col-span-7 space-y-6">
          {/* Featured Event Card */}
          <div
            className="relative rounded-[10px] overflow-hidden shadow-lg h-34 bg-cover bg-center flex flex-col justify-between p-2 pb-0 text-white"
            style={{
              backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.85)), url(${event.banner_url})`,
            }}
          >
            <span className="absolute top-2 left-2 bg-white/20 backdrop-blur-xs border border-white/40 text-white text-[10px] font-medium tracking-wider px-2.5 py-1 rounded-md uppercase transition-all duration-300 group-hover:bg-white/30">
              Upcoming
            </span>
            <div className="mt-auto space-y-2">
              <h2 className="text-2xl font-irish font-bold tracking-wide">
                {event.name}
              </h2>

              <div className="space-x-4 mb-4 flex gap-1 flex-wrap items-center text-white">
                <div className="flex items-center text-xs gap-1">
                  <CustomCalendarIcon />
                  <span>{formatEventTime(event.date)}</span>
                </div>

                {event.location_type === "physical" ? (
                  <div className="flex items-center text-xs font-medium gap-1">
                    <CustomMapPinIcon />
                    <span className="capitalize line-clamp-1">
                      {event.location && event.location !== "string"
                        ? event.location
                        : "Physical Event"}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center text-xs font-medium gap-1">
                    <Video size={16} className="shrink-0 " />
                    {event.link && event.link !== "string" ? (
                      <Link
                        href={
                          event.link.startsWith("http")
                            ? event.link
                            : `https://${event.link}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
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
                <div className="flex items-center gap-1 text-xs">
                  <Users size={15} className="text-[#34D399]" />
                  <span>400 going</span>
                </div>
              </div>
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <p className="text-gray-500 my-4 text-[13px]">
              Choose a ticket category
            </p>
            <div className="space-y-3">
              {ticketCategories.map((cat, index) => {
                const isSelected = selectedCategoryId === cat.ticket_name;
                const qty = quantities[cat.ticket_name] || 0;

                return (
                  <TicketCard
                    cat={cat}
                    handleSelectCategory={handleSelectCategory}
                    isSelected={isSelected}
                    updateQuantity={updateQuantity}
                    qty={qty}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column - Order Summary */}
        <div className="lg:col-span-5 lg:sticky lg:top-16">
          <div className="bg-white rounded-xl p-6 shadow-xl border-[0.53px] border-black/10">
            <h3 className="text-[13px] font-bold text-black mb-6">
              Order Summary
            </h3>

            <div className="space-y-4 text-xs mb-6">
              {/* Dynamically displays chosen item */}
              {activeQty > 0 && activeCategory && (
                <div className="flex justify-between items-center text-gray-600">
                  <span>
                    {activeCategory.ticket_name} x {activeQty}
                  </span>
                  <span className="font-semibold text-black">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
              )}

              {/* Service Fee */}
              <div className="flex justify-between items-center text-gray-600">
                <span>Service fee (5%)</span>
                <span className="font-semibold text-gray-800">
                  {formatCurrency(serviceFee)}
                </span>
              </div>

              <div className="border-t border-dashed border-gray-200 pt-4 mt-4 flex justify-between items-center text-xs font-bold text-black">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Action Button */}
            <button className="text-[13px] w-full bg-black hover:bg-neutral-800 text-white font-semibold py-2.5 rounded-[10px] tracking-wide transition shadow-md active:scale-[0.98]">
              Pay {formatCurrency(total)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

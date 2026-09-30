"use client";

import { useEffect, useMemo, useState } from "react";

import { Users, Video } from "lucide-react";

import { CustomCalendarIcon, CustomMapPinIcon } from "@/app/_utils/CustomIcons";

import { useParams, useRouter } from "next/navigation";
import { TicketInfo } from "@/app/_utils/types/event";
import { formatEventTime } from "@/app/_utils/date";
import Link from "next/link";
import useEvent from "@/app/hooks/use-events";
import TicketCard from "./TicketCard";
import AuthModal from "@/app/_components/AuthModal";
import { useAuth } from "@/app/context/AuthContext";
import RedirectModal from "./RedirectModal";

export default function PrePayment() {
  const router = useRouter();
  const { authDetails, showAuthModal, setShowAuthModal } = useAuth();
  const { eventId } = useParams<{ eventId: string }>();
  const { useGetEvent, useMyPaymentStatuses, attendEvent } = useEvent();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [isRedirectingToPayment, setIsRedirectingToPayment] = useState(false);
  // EVENT
  const {
    data: event,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetEvent(eventId);
  // USER PAYMENT STATUS FOR THIS EVENT
  const { data: paymentStatuses = [], isLoading: isLoadingPaymentStatus } =
    useMyPaymentStatuses({
      event_id: eventId,
      page: 1,
      page_size: 100,
    });
  // FIND EXISTING PENDING PAYMENT
  const existingPayment = useMemo(() => {
    if (!Array.isArray(paymentStatuses)) {
      return null;
    }
    return (
      paymentStatuses.find(
        (payment: any) =>
          payment.event_id === eventId &&
          payment.payment_status === "pending" &&
          payment.attendance_status === "pending_payment" &&
          !!payment.payment_url,
      ) ?? null
    );
  }, [paymentStatuses, eventId]);
  // TICKET CATEGORIES
  const ticketCategories: TicketInfo[] = event?.ticket_info ?? [];
  // INITIAL TICKET SELECTION
  useEffect(() => {
    if (!ticketCategories.length) {
      return;
    }

    /*
     * Always initialize to the first available
     * ticket.
     *
     * We intentionally DO NOT restore the old
     * pending payment's ticket here because the
     * user may want to purchase another ticket.
     */
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
  // SELECT CATEGORY
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
  // UPDATE QUANTITY
  const updateQuantity = (ticketName: string, amount: number) => {
    setQuantities((prev) => ({
      ...prev,

      [ticketName]: Math.max(
        ticketName === selectedCategoryId ? 1 : 0,

        (prev[ticketName] || 0) + amount,
      ),
    }));
  };
  // CONTINUE OLD PAYMENT
  const handleContinuePreviousPayment = () => {
    if (!existingPayment?.payment_url) {
      return;
    }

    sessionStorage.setItem(
      "pending_event_payment",
      JSON.stringify({
        eventId,

        paymentReference: existingPayment.payment_reference,
      }),
    );

    setIsRedirectingToPayment(true);

    window.setTimeout(() => {
      window.location.assign(existingPayment.payment_url);
    }, 700);
  };
  // NEW PAYMENT / NEW TICKET
  const handleSubmit = () => {
    if (!authDetails?.access_token) {
      setShowAuthModal(true);
      return;
    }

    const activeCategory = ticketCategories.find(
      (ticket) => ticket.ticket_name === selectedCategoryId,
    );

    if (!activeCategory) {
      return;
    }

    const quantity = quantities[selectedCategoryId] || 0;

    if (quantity <= 0) {
      return;
    }

    /*
     * We do NOT check existingPayment here.
     *
     * The main Pay button means:
     * "Buy the ticket I have selected now."
     *
     * The old pending payment is handled only
     * by the "Continue Previous Payment" button.
     */

    attendEvent.mutate(
      {
        eventId,

        payload: {
          ticket_name: activeCategory.ticket_name,

          quantity,
        },
      },

      {
        onSuccess: (data) => {
          console.log("payment info", data);

          if (data?.payment_url) {
            sessionStorage.setItem(
              "pending_event_payment",
              JSON.stringify({
                eventId,

                paymentReference: data.payment_reference,
              }),
            );
            setIsRedirectingToPayment(true);
            window.setTimeout(() => {
              window.location.assign(data.payment_url);
            }, 700);

            return;
          }

          router.push("/app/events");
        },
      },
    );
  };
  // ORDER SUMMARY
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
  // LOADING EVENT
  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        Loading event...
      </div>
    );
  }
  // ERROR
  if (isError) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-red-500">
          {(error as Error)?.message || "Unable to load event"}
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
  // EVENT NOT FOUND
  if (!event) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        Event not found.
      </div>
    );
  }
  // PAGE
  return (
    <div className="pb-20">
      {/* PAGE HEADER */}
      <div className="my-8">
        <h1 className="text-2xl font-medium tracking-tight text-black">
          Get Ticket
        </h1>
        <p className="mt-1 text-[13px] font-medium text-gray-700">
          {event.name} • {event.location_type}
        </p>
      </div>
      {/* MAIN GRID */}
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        {/* LEFT COLUMN */}
        <div className="space-y-6 lg:col-span-7">
          {/* EVENT CARD */}
          <div
            className="relative flex h-34 flex-col justify-between overflow-hidden rounded-[10px] bg-cover bg-center p-2 pb-0 text-white shadow-lg"
            style={{
              backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.85)), url(${event.banner_url})`,
            }}
          >
            <span className="absolute left-2 top-2 rounded-md border border-white/40 bg-white/20 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-white backdrop-blur-xs">
              Upcoming
            </span>

            <div className="mt-auto space-y-2">
              <h2 className="font-irish text-2xl font-bold tracking-wide">
                {event.name}
              </h2>

              <div className="mb-4 flex flex-wrap items-center gap-1 space-x-4 text-white">
                {/* Date */}
                <div className="flex items-center gap-1 text-xs">
                  <CustomCalendarIcon />
                  <span>{formatEventTime(event.date)}</span>
                </div>

                {/* Location */}
                {event.location_type === "physical" ? (
                  <div className="flex items-center gap-1 text-xs font-medium">
                    <CustomMapPinIcon />
                    <span className="line-clamp-1 capitalize">
                      {event.location && event.location !== "string"
                        ? event.location
                        : "Physical Event"}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-xs font-medium">
                    <Video size={16} className="shrink-0" />

                    {event.link && event.link !== "string" ? (
                      <Link
                        href={
                          event.link.startsWith("http")
                            ? event.link
                            : `https://${event.link}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="line-clamp-1 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Virtual Event
                      </Link>
                    ) : (
                      <span className="capitalize">Virtual Event</span>
                    )}
                  </div>
                )}

                {/* Going */}
                <div className="flex items-center gap-1 text-xs">
                  <Users size={15} className="text-[#34D399]" />
                  <span>400 going</span>
                </div>
              </div>
            </div>
          </div>

          {/* EXISTING PAYMENT NOTICE */}
          {existingPayment?.payment_url && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100">
                  <span className="text-sm">!</span>
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-black">
                    You have an unfinished payment
                  </p>

                  <p className="mt-1 text-xs leading-5 text-gray-600">
                    You previously started a payment for this event. You can
                    continue that payment or select a ticket below to make a new
                    purchase.
                  </p>

                  <button
                    type="button"
                    onClick={handleContinuePreviousPayment}
                    disabled={isRedirectingToPayment}
                    className="mt-3 rounded-lg border border-black bg-white px-4 py-2.5 text-xs font-semibold text-black transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Continue Previous Payment
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TICKET CATEGORIES */}
          <div>
            <p className="my-4 text-[13px] text-gray-500">
              Choose a ticket category
            </p>

            <div className="space-y-3">
              {ticketCategories.map((cat) => {
                const isSelected = selectedCategoryId === cat.ticket_name;

                const qty = quantities[cat.ticket_name] || 0;

                return (
                  <TicketCard
                    key={cat.ticket_name}
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

        {/* RIGHT COLUMN */}
        <div className="lg:sticky lg:top-16 lg:col-span-5">
          <div className="rounded-xl border-[0.53px] border-black/10 bg-white p-6 shadow-xl">
            <h3 className="mb-6 text-[13px] font-bold text-black">
              Order Summary
            </h3>

            <div className="mb-6 space-y-4 text-xs">
              {/* Selected ticket */}
              {activeQty > 0 && activeCategory && (
                <div className="flex items-center justify-between text-gray-600">
                  <span>
                    {activeCategory.ticket_name} x {activeQty}
                  </span>

                  <span className="font-semibold text-black">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
              )}

              {/* Service fee */}
              <div className="flex items-center justify-between text-gray-600">
                <span>Service fee (5%)</span>
                <span className="font-semibold text-gray-800">
                  {formatCurrency(serviceFee)}
                </span>
              </div>

              {/* Total */}
              <div className="mt-4 flex items-center justify-between border-t border-dashed border-gray-200 pt-4 text-xs font-bold text-black">
                <span>Total</span>

                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            {/* NEW PURCHASE BUTTON */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={
                attendEvent.isPending ||
                isLoadingPaymentStatus ||
                activeQty === 0 ||
                isRedirectingToPayment
              }
              className="w-full cursor-pointer rounded-[10px] bg-black py-2.5 text-[13px] font-semibold tracking-wide text-white shadow-md transition active:scale-[0.98] hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {attendEvent.isPending
                ? "Processing..."
                : isLoadingPaymentStatus
                  ? "Checking payment..."
                  : total === 0
                    ? "Get Free Ticket"
                    : `Pay ${formatCurrency(total)}`}
            </button>

            {/* Small explanation */}
            {existingPayment?.payment_url && (
              <p className="mt-3 text-center text-[11px] leading-5 text-gray-500">
                This payment is separate from your previous unfinished payment.
              </p>
            )}
          </div>
        </div>
      </div>
      {/* AUTH MODAL */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
      {/* PAYSTACK REDIRECT MODAL */}
      {isRedirectingToPayment && <RedirectModal />}
    </div>
  );
}

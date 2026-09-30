"use client";

import { useEffect, useMemo } from "react";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Ticket,
  XCircle,
} from "lucide-react";

import { useRouter, useSearchParams } from "next/navigation";

import useEvents from "@/app/hooks/use-events";

interface EventTicket {
  id: string;
  code: string;
  qr_code_url: string;
  status: string;
  ticket_name: string;
}

interface PaymentStatus {
  id: string;
  user_id: string;
  event_id: string;

  ticket_info: {
    ticket_name: string;
    price: number;
    ticket_description: string | null;
    capacity: number | null;
    quantity: number;
  }[];

  total_amount: number;
  total_tickets: number;

  payment_status: string;
  payment_reference: string;
  payment_url: string;

  attendance_status: string;

  tickets: EventTicket[];

  total_tickets_issued: number;
}

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference");

  const { useMyPaymentStatuses } = useEvents();

  /*
   * Get the event/payment information we stored
   * before redirecting the user to Paystack.
   */
  const pendingPayment = useMemo(() => {
    if (typeof window === "undefined") {
      return null;
    }

    try {
      const stored = sessionStorage.getItem("pending_event_payment");

      if (!stored) {
        return null;
      }

      return JSON.parse(stored) as {
        eventId?: string;
        paymentReference?: string;
      };
    } catch (error) {
      console.error("Unable to read pending payment:", error);

      return null;
    }
  }, []);

  const eventId = pendingPayment?.eventId;

  /*
   * Get payment status for this event.
   */
  const {
    data: paymentStatuses = [],
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useMyPaymentStatuses({
    event_id: eventId,
    page: 1,
    page_size: 100,
  });

  /*
   * Find the exact transaction using the
   * Paystack reference.
   */
  const payment = useMemo<PaymentStatus | null>(() => {
    if (!reference || !Array.isArray(paymentStatuses)) {
      return null;
    }

    return (
      paymentStatuses.find(
        (item: PaymentStatus) => item.payment_reference === reference,
      ) ?? null
    );
  }, [paymentStatuses, reference]);

  const paymentStatus = payment?.payment_status?.toLowerCase();

  const attendanceStatus = payment?.attendance_status?.toLowerCase();

  const isSuccessful =
    paymentStatus === "successful" && attendanceStatus === "confirmed";

  /*
   * Handle failed/cancelled states.
   */
  const isFailed =
    paymentStatus === "failed" ||
    paymentStatus === "failure" ||
    paymentStatus === "cancelled" ||
    paymentStatus === "canceled" ||
    paymentStatus === "abandoned" ||
    attendanceStatus === "failed" ||
    attendanceStatus === "cancelled" ||
    attendanceStatus === "canceled";

  /*
   * Keep checking the backend while the payment
   * is still pending.
   */
  useEffect(() => {
    if (!reference || !eventId || isSuccessful || isFailed) {
      return;
    }

    const interval = window.setInterval(() => {
      refetch();
    }, 2000);

    return () => {
      window.clearInterval(interval);
    };
  }, [reference, eventId, isSuccessful, isFailed, refetch]);

  if (!reference) {
    return (
      <main className="min-h-[80vh] bg-[#ECECF080] px-4 py-10">
        <div className="mx-auto flex min-h-[70vh] max-w-lg items-center justify-center">
          <div className="w-full rounded-2xl border border-black/10 bg-white p-8 text-center shadow-xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
              <XCircle size={36} className="text-red-500" />
            </div>

            <h1 className="mt-5 text-2xl font-semibold text-black">
              Payment could not be confirmed
            </h1>

            <p className="mt-3 text-sm leading-6 text-gray-500">
              We could not find a payment reference from Paystack. Please return
              to the event and try again.
            </p>

            <button
              onClick={() => router.push("/app/events")}
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              <ArrowLeft size={16} />
              Back to Events
            </button>
          </div>
        </div>
      </main>
    );
  }

  /** SUCCESS*/

  if (isSuccessful && payment) {
    const ticket = payment.tickets?.[0];

    const ticketInfo = payment.ticket_info?.[0];

    return (
      <main className="min-h-[80vh] bg-[#ECECF080] px-4 py-10">
        <div className="mx-auto flex min-h-[70vh] max-w-lg items-center justify-center">
          <div className="w-full overflow-hidden rounded-2xl border border-black/10 bg-white shadow-xl">
            <div className="px-8 pb-6 pt-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
                <CheckCircle2 size={40} className="text-green-600" />
              </div>

              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-green-600">
                Payment Successful
              </p>

              <h1 className="mt-2 text-2xl font-semibold text-black">
                Your ticket is confirmed
              </h1>

              <p className="mt-3 text-sm leading-6 text-gray-500">
                Your payment has been confirmed and your attendance has been
                successfully recorded.
              </p>
            </div>

            {ticket?.qr_code_url && (
              <div className="border-y border-black/10 bg-gray-50 px-8 py-7 text-center">
                <p className="mb-4 text-xs font-medium text-gray-500">
                  Ticket QR Code
                </p>

                <div className="mx-auto flex w-fit rounded-2xl bg-white p-4 shadow-sm">
                  <img
                    src={ticket.qr_code_url}
                    alt="Event ticket QR code"
                    className="h-52 w-52 object-contain"
                  />
                </div>

                <p className="mt-4 text-xs text-gray-400">
                  Show this QR code at the event entrance.
                </p>
              </div>
            )}
            <div className="px-8 py-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black text-white">
                  <Ticket size={18} />
                </div>

                <div>
                  <p className="text-xs text-gray-500">Ticket</p>

                  <p className="text-sm font-semibold text-black">
                    {ticket?.ticket_name ||
                      ticketInfo?.ticket_name ||
                      "Event Ticket"}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-5 border-t border-black/10 pt-5">
                {/* Quantity */}
                <div>
                  <p className="text-xs text-gray-500">Quantity</p>

                  <p className="mt-1 text-sm font-semibold text-black">
                    {payment.total_tickets}
                  </p>
                </div>

                {/* Amount */}
                <div>
                  <p className="text-xs text-gray-500">Amount Paid</p>

                  <p className="mt-1 text-sm font-semibold text-black">
                    ₦{payment.total_amount.toLocaleString("en-NG")}
                  </p>
                </div>

                {/* Ticket Code */}
                {ticket?.code && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Ticket Code</p>

                    <p className="mt-1 font-mono text-sm font-semibold text-black">
                      {ticket.code}
                    </p>
                  </div>
                )}

                {/* Reference */}
                <div className="col-span-2">
                  <p className="text-xs text-gray-500">Payment Reference</p>

                  <p className="mt-1 break-all font-mono text-[11px] text-black">
                    {payment.payment_reference}
                  </p>
                </div>

                {/* Status */}
                <div className="col-span-2">
                  <p className="text-xs text-gray-500">Status</p>

                  <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5">
                    <span className="h-2 w-2 rounded-full bg-green-500" />

                    <span className="text-xs font-medium capitalize text-green-700">
                      {payment.tickets?.[0]?.status || "Valid"}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  sessionStorage.removeItem("pending_event_payment");

                  router.push(`/app/events/${payment.event_id}`);
                }}
                className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
              >
                View Event
                <ArrowRight size={16} />
              </button>

              <button
                onClick={() => {
                  sessionStorage.removeItem("pending_event_payment");

                  router.push("/app/events");
                }}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-black/10 px-5 py-3 text-sm font-semibold text-black transition hover:bg-gray-50"
              >
                <ArrowLeft size={16} />
                Back to Events
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  /** FAILED*/
  if (isFailed) {
    return (
      <main className="min-h-[80vh] bg-[#ECECF080] px-4 py-10">
        <div className="mx-auto flex min-h-[70vh] max-w-lg items-center justify-center">
          <div className="w-full rounded-2xl border border-black/10 bg-white p-8 text-center shadow-xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
              <XCircle size={38} className="text-red-500" />
            </div>

            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-red-500">
              Payment Failed
            </p>

            <h1 className="mt-2 text-2xl font-semibold text-black">
              Payment was not completed
            </h1>

            <p className="mt-3 text-sm leading-6 text-gray-500">
              We could not confirm this payment. Your ticket has not been
              issued.
            </p>

            <div className="mt-6 rounded-xl bg-gray-50 p-4 text-left">
              <p className="text-xs text-gray-500">Payment Reference</p>

              <p className="mt-1 break-all font-mono text-xs text-black">
                {reference}
              </p>
            </div>

            <button
              onClick={() => router.push(`/app/events/${eventId}`)}
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              Try Again
              <ArrowRight size={16} />
            </button>

            <button
              onClick={() => router.push("/app/events")}
              className="mt-3 w-full rounded-xl border border-black/10 px-5 py-3 text-sm font-semibold text-black transition hover:bg-gray-50"
            >
              Back to Events
            </button>
          </div>
        </div>
      </main>
    );
  }

  /** WAITING / PENDING*/
  return (
    <main className="min-h-[80vh] bg-[#ECECF080] px-4 py-10">
      <div className="mx-auto flex min-h-[70vh] max-w-lg items-center justify-center">
        <div className="w-full rounded-2xl border border-black/10 bg-white p-8 text-center shadow-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-black">
            <Loader2 size={32} className="animate-spin text-white" />
          </div>

          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
            Payment Received
          </p>

          <h1 className="mt-2 text-2xl font-semibold text-black">
            Confirming your payment
          </h1>

          <p className="mt-3 text-sm leading-6 text-gray-500">
            Your payment has been submitted. We are waiting for confirmation
            from the payment system before issuing your ticket.
          </p>

          <div className="mt-6 rounded-xl bg-gray-50 p-4 text-left">
            <p className="text-xs text-gray-500">Payment Reference</p>

            <p className="mt-1 break-all font-mono text-xs text-black">
              {reference}
            </p>
          </div>

          <div className="mt-5 flex items-center justify-center gap-2 text-xs text-gray-400">
            <Loader2 size={14} className="animate-spin" />

            {isLoading || isFetching
              ? "Checking payment status..."
              : isError
                ? "Unable to check status. Retrying..."
                : "Waiting for confirmation..."}
          </div>

          <button
            onClick={() => refetch()}
            className="mt-6 rounded-xl border border-black/10 px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-gray-50"
          >
            Check Again
          </button>
        </div>
      </div>
    </main>
  );
}

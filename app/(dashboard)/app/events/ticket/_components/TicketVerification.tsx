"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  LoaderCircle,
  X,
} from "lucide-react";

import { ScannerIcon, TicketIcon } from "@/app/_utils/CustomIcons";

import useEvents from "@/app/hooks/use-events";

type TicketVerificationMode = "page" | "modal";

interface TicketVerificationProps {
  eventId?: string;
  onCancel?: () => void;
  mode?: TicketVerificationMode;
}

interface ParsedTicket {
  code: string;
  eventId?: string;
}

type ApiRecord = Record<string, unknown>;

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value).trim();
  } catch {
    return value.trim();
  }
}

/**
 * Supports QR values such as:
 *
 * verify://ticket/VWxD81J7F5?u=EVENT_UUID
 *
 * Also supports JSON payloads, regular URLs, and plain ticket codes.
 */
function extractTicketData(value: string): ParsedTicket {
  const raw = value.trim();

  if (!raw) {
    return { code: "" };
  }

  // QR codes containing JSON.
  try {
    const payload: unknown = JSON.parse(raw);

    if (typeof payload === "string") {
      return extractTicketData(payload);
    }

    if (payload && typeof payload === "object") {
      const data = payload as ApiRecord;

      const code = firstString(
        data.code,
        data.ticket_code,
        data.ticketCode,
        data.ticketRef,
        data.ticket_ref,
        data.reference,
      );

      const eventId = firstString(
        data.eventId,
        data.event_id,
        data.eventID,
        data.event,
        data.u,
      );

      if (code) {
        return { code, eventId };
      }
    }
  } catch {
    // Continue parsing as a URL or plain ticket code.
  }

  // QR URLs and custom schemes.
  try {
    const url = new URL(raw);

    const eventId = firstString(
      url.searchParams.get("eventId"),
      url.searchParams.get("event_id"),
      url.searchParams.get("eventID"),
      url.searchParams.get("event"),
      // The supplied QR format stores the event ID in "u".
      url.searchParams.get("u"),
    );

    // If the code is supplied as a query parameter.
    const queryCode = firstString(
      url.searchParams.get("code"),
      url.searchParams.get("ticket_code"),
      url.searchParams.get("ticketCode"),
      url.searchParams.get("ticketRef"),
      url.searchParams.get("reference"),
    );

    if (queryCode) {
      return {
        code: safeDecode(queryCode),
        eventId,
      };
    }

    // Custom QR format:
    // verify://ticket/VWxD81J7F5?u=EVENT_UUID
    if (url.protocol === "verify:" && url.hostname.toLowerCase() === "ticket") {
      const code = url.pathname.split("/").filter(Boolean)[0];

      return {
        code: code ? safeDecode(code) : "",
        eventId,
      };
    }

    // Standard URL format containing /ticket/CODE.
    const segments = url.pathname.split("/").filter(Boolean);

    const ticketIndex = segments.findIndex(
      (segment) => segment.toLowerCase() === "ticket",
    );

    if (ticketIndex !== -1 && segments[ticketIndex + 1]) {
      return {
        code: safeDecode(segments[ticketIndex + 1]),
        eventId,
      };
    }
  } catch {
    // Plain text ticket references are supported below.
  }

  // Manual entry or a plain ticket-code QR.
  return { code: raw };
}

function getApiMessage(value: unknown): string | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const record = value as ApiRecord;

  const response = record.response;
  const responseData =
    response && typeof response === "object"
      ? (response as ApiRecord).data
      : undefined;

  const data =
    record.data && typeof record.data === "object"
      ? (record.data as ApiRecord)
      : undefined;

  const nestedData =
    data?.data && typeof data.data === "object"
      ? (data.data as ApiRecord)
      : undefined;

  return firstString(
    responseData && typeof responseData === "object"
      ? (responseData as ApiRecord).message
      : undefined,
    nestedData?.message,
    data?.message,
    record.message,
  );
}

/**
 * Some APIs return HTTP 200 with an application-level failure.
 * Check the response body before displaying a success state.
 */
function assertVerificationAccepted(response: unknown): void {
  if (response == null || response === false) {
    throw new Error(
      "The server did not return a verification result. Please try again.",
    );
  }

  const records: ApiRecord[] = [];
  let current: unknown = response;

  // Inspect Axios responses and common nested API envelopes.
  for (let depth = 0; depth < 4; depth += 1) {
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      break;
    }

    const record = current as ApiRecord;
    records.push(record);

    current = record.data;
  }

  for (const record of records) {
    const statusCodeValue = record.status_code ?? record.statusCode;

    if (statusCodeValue !== undefined) {
      const statusCode = Number(statusCodeValue);

      if (
        Number.isFinite(statusCode) &&
        (statusCode < 200 || statusCode >= 300)
      ) {
        throw new Error(
          firstString(record.message, record.error) ||
            "The server could not verify this ticket.",
        );
      }
    }

    const status =
      typeof record.status === "string" ? record.status.toLowerCase() : "";

    if (
      record.success === false ||
      record.verified === false ||
      record.is_valid === false ||
      record.valid === false ||
      ["error", "failed", "failure", "rejected", "invalid"].includes(status)
    ) {
      throw new Error(
        firstString(record.message, record.error) ||
          "The server rejected this ticket.",
      );
    }
  }
}

function getErrorMessage(error: unknown): string {
  const apiMessage = getApiMessage(error);

  if (apiMessage) {
    return apiMessage;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Ticket verification failed. Please check the ticket and try again.";
}

export default function TicketVerification({
  eventId,
  onCancel,
  mode = "page",
}: TicketVerificationProps) {
  const { verifyTicket } = useEvents();

  const [ticketRef, setTicketRef] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [lastVerifiedCode, setLastVerifiedCode] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const busyRef = useRef(false);

  // Avoid restarting the scanner if the mutation object changes
  // identity between renders.
  const verifyTicketRef = useRef(verifyTicket);

  // Prevent the same QR remaining in front of the camera
  // from being submitted repeatedly after a successful scan.
  const lastSuccessfulScanRef = useRef("");

  const isModal = mode === "modal";

  useEffect(() => {
    verifyTicketRef.current = verifyTicket;
  }, [verifyTicket]);

  const submitCode = useCallback(
    async (rawValue: string, options?: { scanned?: boolean }) => {
      if (busyRef.current) {
        return;
      }

      const parsed = extractTicketData(rawValue);
      const code = parsed.code.trim();

      // The event ID in the QR takes priority. The prop supports
      // manual entry or a page already scoped to an event.
      const resolvedEventId = (parsed.eventId || eventId || "").trim();

      if (!code) {
        setError("Enter a valid ticket reference or scan a ticket QR code.");
        return;
      }

      if (!resolvedEventId) {
        setError(
          "The event ID is missing. Scan a QR containing the event ID or open verification from the relevant event.",
        );
        setIsScanning(false);
        return;
      }

      busyRef.current = true;
      setIsSubmitting(true);
      setError("");
      setSuccess("");
      setLastVerifiedCode("");

      try {
        // Send BOTH values to the verification mutation.
        // mutateAsync resolves only after the mutation's request finishes.
        const response = await verifyTicketRef.current.mutateAsync({
          eventId: resolvedEventId,
          code,
        });

        // Do not show success for an application-level failure.
        assertVerificationAccepted(response);

        const serverMessage = getApiMessage(response);

        setLastVerifiedCode(code);
        setTicketRef("");

        setSuccess(
          serverMessage ||
            "Ticket verified successfully by the server. The attendee may be admitted.",
        );

        if (options?.scanned) {
          lastSuccessfulScanRef.current = code;
        }
      } catch (verificationError) {
        setError(getErrorMessage(verificationError));
      } finally {
        busyRef.current = false;
        setIsSubmitting(false);

        // Keep the queue moving after a server-confirmed scan.
        // Failed scans stay stopped so the organizer can review
        // the rejection before proceeding.
        if (options?.scanned && !error) {
          // State is set explicitly below based on the result.
        }
      }

      // Intentionally handled outside the finally block so the
      // scanner only resumes after a confirmed server response.
    },
    [eventId],
  );

  // Start and stop the camera as needed.
  useEffect(() => {
    if (!isScanning || !videoRef.current) {
      return;
    }

    let disposed = false;
    let foundCode = false;

    let controls: { stop: () => void } | undefined;

    const video = videoRef.current;

    async function startScanner() {
      try {
        // Dynamic import keeps the scanner out of server-side rendering.
        const { BrowserQRCodeReader } = await import("@zxing/browser");

        if (disposed) {
          return;
        }

        const reader = new BrowserQRCodeReader();

        controls = await reader.decodeFromVideoDevice(
          undefined,
          video,
          (result) => {
            if (!result || disposed || foundCode) {
              return;
            }

            const rawValue = result.getText();
            const parsed = extractTicketData(rawValue);

            if (!parsed.code) {
              return;
            }

            // Ignore the last successfully scanned QR while it
            // remains in view.
            if (parsed.code === lastSuccessfulScanRef.current) {
              return;
            }

            foundCode = true;

            // Stop the current scan before sending the request.
            controls?.stop();
            setIsScanning(false);
            setError("");
            setSuccess("");
            setTicketRef(parsed.code);

            void submitCode(rawValue, {
              scanned: true,
            }).then(() => {
              // Resume scanning only when verification succeeded.
              // An error leaves the camera stopped for review.
              if (
                !busyRef.current &&
                !disposed &&
                lastSuccessfulScanRef.current === parsed.code
              ) {
                setIsScanning(true);
              }
            });
          },
        );

        // A QR can be detected before the camera promise resolves.
        if (disposed || foundCode) {
          controls.stop();
        }
      } catch {
        if (!disposed) {
          setError(
            "Unable to open the camera. Allow camera access or enter the ticket reference manually.",
          );
          setIsScanning(false);
        }
      }
    }

    void startScanner();

    return () => {
      disposed = true;
      controls?.stop();
    };
  }, [isScanning, submitCode]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    void submitCode(ticketRef);
  };

  const handleCancel = () => {
    if (busyRef.current) {
      return;
    }

    setIsScanning(false);
    onCancel?.();
  };

  return (
    <div
      className={
        isModal
          ? "h-full w-full max-w-135 overflow-y-auto rounded-4xl border border-black/20 bg-white p-8 pt-0 font-sans shadow-2xl"
          : "w-full max-w-135 rounded-4xl border border-black/20 bg-white p-8 pt-0 font-sans shadow-sm"
      }
    >
      <div className="sticky top-0 flex items-center gap-4 border-b border-gray-100 bg-white pb-4 pt-8">
        <button
          onClick={handleCancel}
          type="button"
          disabled={isSubmitting}
          aria-label={isModal ? "Close ticket verification" : "Go back"}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-black/20 text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isModal ? (
            <X className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>

        <div>
          <h1 className="text-[13px] font-medium text-black">
            Ticket Verification
          </h1>

          <p className="text-xs text-gray-500">
            Verify attendee entry for this event
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col items-center py-8 text-center"
      >
        <div className="mb-4 flex h-14 w-15 items-center justify-center rounded-full bg-[#D9D9D9] text-black/25">
          <TicketIcon />
        </div>

        <h2 className="mb-1 text-sm font-medium text-black">Verify Ticket</h2>

        <p className="mb-8 max-w-90 text-[13px] leading-tight text-[#6D6D6D]">
          Enter the ticket reference or scan the attendee&apos;s QR code.
          Scanned tickets are sent to the server automatically.
        </p>

        <div className="mb-6 w-full text-left">
          <label
            htmlFor="ticketRef"
            className="mb-2 block text-sm font-medium text-black"
          >
            Ticket Reference Number
          </label>

          <input
            id="ticketRef"
            name="ticketRef"
            type="text"
            autoComplete="off"
            value={ticketRef}
            onChange={(event) => {
              setTicketRef(event.target.value);
              setError("");
              setSuccess("");
              setLastVerifiedCode("");
            }}
            placeholder="Enter ticket reference"
            disabled={isSubmitting}
            className="w-full rounded-[10px] border border-black/20 px-4 py-3 text-black placeholder:text-black/30 focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50"
          />

          <p className="mt-2 text-xs text-gray-400">
            The reference can be found on the attendee&apos;s ticket or
            confirmation email.
          </p>
        </div>

        <div className="mb-10 mt-2 flex w-full flex-col items-center">
          {isScanning ? (
            <div className="w-full">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="aspect-video w-full rounded-2xl bg-black object-cover"
              />

              <p className="mt-3 text-xs text-gray-500">
                Point the camera at the ticket QR code.
              </p>

              <button
                type="button"
                onClick={() => setIsScanning(false)}
                className="mt-3 rounded-lg border border-gray-200 px-4 py-2 text-sm transition hover:bg-gray-50"
              >
                Stop scanning
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  setError("");
                  setSuccess("");
                  setIsScanning(true);
                }}
                className="mb-2 flex h-20 w-21.5 items-center justify-center rounded-2xl bg-[#F1F1F1] text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ScannerIcon />
              </button>

              <span className="text-xs font-medium text-black">
                {isSubmitting ? "Verifying ticket..." : "Scan QR Code"}
              </span>
            </>
          )}
        </div>

        {isSubmitting && (
          <div
            role="status"
            aria-live="polite"
            className="mb-4 flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 text-left"
          >
            <LoaderCircle className="h-5 w-5 shrink-0 animate-spin text-gray-700" />

            <div>
              <p className="text-sm font-medium text-gray-900">
                Verifying with the server
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Checking the ticket reference and event.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="mb-4 flex w-full items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-left"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

            <div>
              <p className="text-sm font-medium text-red-800">
                Verification unsuccessful
              </p>

              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div
            role="status"
            aria-live="polite"
            className="mb-4 flex w-full items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-left"
          >
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />

            <div className="min-w-0">
              <p className="text-sm font-semibold text-emerald-900">
                Ticket verified
              </p>

              <p className="mt-1 wrap-break-word text-sm text-emerald-800">
                {success}
              </p>

              {lastVerifiedCode && (
                <p className="mt-2 text-xs text-emerald-700">
                  Reference: {lastVerifiedCode}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="w-full space-y-3 pt-2">
          <button
            type="submit"
            disabled={!ticketRef.trim() || isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-black px-4 py-3 text-[13px] font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSubmitting && <LoaderCircle className="h-4 w-4 animate-spin" />}

            {isSubmitting ? "Verifying with server..." : "Confirm Ticket"}
          </button>

          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="w-full rounded-[10px] border border-gray-200 bg-white px-4 py-3 text-[13px] font-medium text-black transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

"use client";

import { STATUS_CONFIG, timeAgo } from "@/app/_utils/formatters";
import { slugify } from "@/app/_utils/slugify";
import { ConnectionRequest, RequestStatus } from "@/app/_utils/types/connection";
import { useAuth } from "@/app/context/AuthContext";
import useMatch from "@/app/hooks/use-match";
import {
  ArrowUpRight,
  Check,
  Clock3,
  Link2,
  Loader2,
  UserCheck,
  UserRound,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import UserImage from "../../_components/UserImage";
import ConnectionStatusBadge from "./ConnectionStatusBadge";

const normalizedStatus = (value: unknown) =>
  String(value ?? "pending").trim().toLowerCase().replace(/[ -]+/g, "_");

const RequestCard = ({
  r,
  actionLoading,
  onAccept,
  onReject,
}: {
  r: ConnectionRequest;
  actionLoading: "accept" | "reject" | null;
  onAccept: () => void;
  onReject: () => void;
}) => {
  const { authDetails } = useAuth();
  const router = useRouter();
  const { useGetConnectionStatus } = useMatch();
  const cardRef = useRef<HTMLElement | null>(null);
  const [nearViewport, setNearViewport] = useState(false);

  // Fetch live relationship status only as a card approaches the viewport.
  // This avoids firing one request per historical card when the page loads.
  useEffect(() => {
    const element = cardRef.current;
    if (!element) return;
    if (typeof IntersectionObserver === "undefined") {
      setNearViewport(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: "180px 0px" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const currentUserId = authDetails?.user?.id;
  const targetId = r.target_user?.id ?? r.target_user_id;
  const requesterId = r.requester?.id ?? r.requester_id;
  const isRecipient = targetId === currentUserId;
  const person = isRecipient ? r.requester : r.target_user;
  const personId = person?.id ?? (isRecipient ? requesterId : targetId);
  const requestStatus = normalizedStatus(r.status) as RequestStatus;
  const statusCfg = STATUS_CONFIG[requestStatus] ?? STATUS_CONFIG.pending;
  const isActing = !!actionLoading;

  const connectionQuery = useGetConnectionStatus(
    personId,
    !!personId && nearViewport,
  );
  const connection = connectionQuery.data as
    | {
        other_user_id?: string;
        status?: string | null;
        is_connected?: boolean;
        request_id?: string | null;
        request_direction?: string | null;
      }
    | null
    | undefined;
  const liveStatus = normalizedStatus(connection?.status);
  const connectionRefersToThisRequest =
    !connection?.request_id || connection.request_id === r.request_id;
  const connectionSaysConnected = connection?.is_connected === true;
  const connectionSaysClosed =
    connectionRefersToThisRequest &&
    ["expired", "rejected", "declined", "cancelled", "canceled", "withdrawn"].includes(liveStatus);
  const requestPending = requestStatus === "pending";
  const canRespond =
    requestPending &&
    isRecipient &&
    !connectionSaysConnected &&
    !connectionSaysClosed &&
    (!connectionQuery.isLoading || connectionQuery.isError);

  const goToProfile = () => {
    if (!personId) return;
    router.push(`/app/profile/${slugify(person?.full_name ?? "member")}_${personId}`);
  };

  return (
    <article ref={cardRef} className="group flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 transition duration-200 hover:border-slate-300 hover:shadow-[0_5px_20px_rgba(15,23,42,0.05)] sm:flex-row sm:items-center sm:gap-4 sm:p-4.5">
      <button
        type="button"
        onClick={goToProfile}
        aria-label={`View ${person?.full_name ?? "user"}'s profile`}
        className="flex min-w-0 flex-1 items-center gap-3.5 text-left"
      >
        <span className="relative shrink-0">
          {person ? (
            <UserImage user={person} rounded="rounded-full" size={48} />
          ) : (
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <UserRound size={20} />
            </span>
          )}
          {canRespond && (
            <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-orange-500" />
          )}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-semibold text-slate-900 transition group-hover:text-orange-700">
              {person?.full_name ?? "Bouwnce member"}
            </span>
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusCfg.pill}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
              {statusCfg.label}
            </span>
          </span>

          <span className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-slate-500">
            <Link2 size={12} className="shrink-0 text-slate-400" />
            <span className="truncate">
              {isRecipient
                ? "Would like to connect with you"
                : `You sent a request to ${person?.full_name ?? "this member"}`}
            </span>
          </span>

          <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-400">
            <span className="inline-flex items-center gap-1">
              <Clock3 size={11} className="shrink-0" />
              {timeAgo(r.created_at)}
            </span>
            {person?.username && <span className="truncate">· @{person.username}</span>}
          </span>

          <span className="mt-2 block">
            <ConnectionStatusBadge
              data={connection}
              loading={connectionQuery.isLoading}
              failed={connectionQuery.isError}
            />
          </span>
        </span>
        <ArrowUpRight className="hidden h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-slate-500 sm:block" />
      </button>

      <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-slate-100 pt-3 sm:border-0 sm:pt-0">
        {canRespond ? (
          <>
            <button
              type="button"
              onClick={onReject}
              disabled={isActing}
              className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
            >
              {actionLoading === "reject" ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
              Decline
            </button>
            <button
              type="button"
              onClick={onAccept}
              disabled={isActing}
              className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-orange-600 px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
            >
              {actionLoading === "accept" ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Accept
            </button>
          </>
        ) : connectionSaysConnected ? (
          <span className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 sm:w-auto">
            <UserCheck size={14} /> Connected
          </span>
        ) : requestPending && connectionSaysClosed ? (
          <span className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500 sm:w-auto">
            <X size={13} /> No longer active
          </span>
        ) : requestPending && connectionQuery.isLoading ? (
          <span className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500 sm:w-auto">
            <Loader2 size={13} className="animate-spin" /> Checking status
          </span>
        ) : requestPending ? (
          <span className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 sm:w-auto">
            <Clock3 size={13} /> {isRecipient ? "Awaiting your response" : "Waiting for response"}
          </span>
        ) : requestStatus === "accepted" && connection?.is_connected !== false ? (
          <span className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 sm:w-auto">
            <UserCheck size={14} /> Accepted
          </span>
        ) : (
          <span className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500 sm:w-auto">
            <X size={13} /> Closed
          </span>
        )}
      </div>
    </article>
  );
};

export default RequestCard;

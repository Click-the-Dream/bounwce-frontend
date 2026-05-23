"use client";

import { useMemo, useState } from "react";
import {
  Check,
  X,
  UserCheck,
  Clock,
  Users,
  Link2,
  XCircle,
  Loader2,
} from "lucide-react";
import CardHeader from "../../admin/_components/CardHeader";
import Card from "../../admin/_components/Card";
import useMatch from "@/app/hooks/use-match";
import { useQueryClient } from "@tanstack/react-query";
import { onSuccess, onFailure } from "@/app/_utils/notification";

type RequestStatus = "pending" | "accepted" | "rejected" | "expired";
type ActionLoading = Record<string, "accept" | "reject" | null>;

interface ConnectionRequest {
  request_id: string;
  requester_id: string;
  target_user_id: string;
  status: RequestStatus;
  created_at: string;
  responded_at: string | null;
}

const normalizeStatus = (status: RequestStatus) =>
  status === "expired" ? "rejected" : status;

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const getInitials = (id: string) => id?.slice(0, 2).toUpperCase() ?? "??";

const AVATAR_COLORS = [
  "bg-violet-100 text-violet-700",
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-orange-100 text-orange-700",
  "bg-pink-100 text-pink-700",
];

const avatarColor = (id: string) =>
  AVATAR_COLORS[id?.charCodeAt(0) % AVATAR_COLORS.length] ?? AVATAR_COLORS[0];

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    pill: "bg-amber-50 text-amber-600 border-amber-200",
    dot: "bg-amber-400",
  },
  accepted: {
    label: "Accepted",
    pill: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  rejected: {
    label: "Rejected",
    pill: "bg-red-50 text-red-600 border-red-200",
    dot: "bg-red-400",
  },
  expired: {
    label: "Expired",
    pill: "bg-slate-100 text-slate-500 border-slate-200",
    dot: "bg-slate-400",
  },
};

// ── Skeleton ─────────────────────────────────────────────────────────────────
const SkeletonRow = () => (
  <div className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-white animate-pulse">
    <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-3 w-32 bg-slate-200 rounded-full" />
      <div className="h-2.5 w-48 bg-slate-100 rounded-full" />
    </div>
    <div className="flex gap-2">
      <div className="h-8 w-20 bg-slate-100 rounded-xl" />
      <div className="h-8 w-20 bg-slate-100 rounded-xl" />
    </div>
  </div>
);

// ── Empty state ───────────────────────────────────────────────────────────────
const EmptyState = ({ filter }: { filter: string }) => (
  <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
    <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
      <Users size={24} className="text-slate-300" />
    </div>
    <p className="text-sm font-medium">
      No {filter === "all" ? "" : filter} requests
    </p>
    <p className="text-xs">They'll show up here when they arrive</p>
  </div>
);

// ── Error state ───────────────────────────────────────────────────────────────
const ErrorState = ({ onRetry }: { onRetry: () => void }) => (
  <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
    <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
      <XCircle size={24} className="text-red-300" />
    </div>
    <p className="text-sm font-medium text-slate-600">
      Failed to load requests
    </p>
    <button
      onClick={onRetry}
      className="text-xs px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition font-medium"
    >
      Try again
    </button>
  </div>
);

// ── Request card ──────────────────────────────────────────────────────────────
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
  const normalized = normalizeStatus(r.status);
  const statusCfg = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.pending;
  const isActing = !!actionLoading;

  return (
    <div className="group flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm transition-all duration-150">
      {/* Avatar */}
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${avatarColor(r.requester_id)}`}
      >
        {getInitials(r.requester_id)}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-slate-800 truncate">
            {r.requester_id}
          </span>
          {/* Status pill */}
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusCfg.pill}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
            {statusCfg.label}
          </span>
        </div>

        <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5 truncate">
          <Link2 size={10} className="shrink-0" />
          <span className="truncate">wants to connect with</span>
          <span className="font-medium text-slate-600 truncate">
            {r.target_user_id}
          </span>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1">
          <Clock size={10} className="shrink-0" />
          {timeAgo(r.created_at)}
          {r.responded_at && (
            <span className="ml-2 text-slate-300">
              · responded {timeAgo(r.responded_at)}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {normalized === "pending" ? (
          <>
            <button
              onClick={onAccept}
              disabled={isActing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {actionLoading === "accept" ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Check size={13} />
              )}
              Accept
            </button>

            <button
              onClick={onReject}
              disabled={isActing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {actionLoading === "reject" ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <X size={13} />
              )}
              Reject
            </button>
          </>
        ) : (
          <div
            className={`flex items-center gap-1.5 text-xs font-medium ${
              normalized === "accepted" ? "text-emerald-600" : "text-slate-400"
            }`}
          >
            <UserCheck size={14} />
            {statusCfg.label}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────
export default function RequestsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<RequestStatus | "all">("all");
  const [actionLoading, setActionLoading] = useState<ActionLoading>({});

  const { useGetMatchRequests, respondToMatchRequest } = useMatch();
  const { data, isLoading, isError, refetch } = useGetMatchRequests();

  const requests: ConnectionRequest[] = data?.items || [];

  const filtered = useMemo(() => {
    if (filter === "all") return requests;
    return requests.filter((r) =>
      filter === "rejected"
        ? r.status === "rejected" || r.status === "expired"
        : r.status === filter,
    );
  }, [filter, requests]);

  const stats = {
    all: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    accepted: requests.filter((r) => r.status === "accepted").length,
    rejected: requests.filter(
      (r) => r.status === "rejected" || r.status === "expired",
    ).length,
  };

  const handleRespond = (request_id: string, action: "accept" | "reject") => {
    setActionLoading((prev) => ({ ...prev, [request_id]: action }));

    respondToMatchRequest.mutate(
      { request_id, action },
      {
        onSuccess: () => {
          onSuccess({
            title: action === "accept" ? "Connected!" : "Request rejected",
            message:
              action === "accept"
                ? "You are now connected."
                : "Request has been rejected.",
          });
          queryClient.invalidateQueries();
        },
        onError: () => {
          onFailure({
            title: "Failed",
            message: "Something went wrong. Try again.",
          });
        },
        onSettled: () => {
          setActionLoading((prev) => ({ ...prev, [request_id]: null }));
        },
      },
    );
  };

  const TABS = [
    { key: "all", label: "All", count: stats.all },
    { key: "pending", label: "Pending", count: stats.pending },
    { key: "accepted", label: "Accepted", count: stats.accepted },
    { key: "rejected", label: "Rejected", count: stats.rejected },
  ];

  return (
    <Card>
      <CardHeader>
        <div>
          <h3 className="font-semibold text-slate-800">Connection Requests</h3>
          <p className="text-xs text-slate-400">
            Manage incoming connection requests
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filter === tab.key
                  ? "bg-black text-white shadow-sm"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {tab.label}
              <span
                className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                  filter === tab.key
                    ? "bg-white/20 text-white"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </CardHeader>

      <div className="px-6 pb-6 space-y-3">
        {isLoading ? (
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </>
        ) : isError ? (
          <ErrorState onRetry={refetch} />
        ) : filtered.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          filtered.map((r) => (
            <RequestCard
              key={r.request_id}
              r={r}
              actionLoading={actionLoading[r.request_id] ?? null}
              onAccept={() => handleRespond(r.request_id, "accept")}
              onReject={() => handleRespond(r.request_id, "reject")}
            />
          ))
        )}
      </div>
    </Card>
  );
}

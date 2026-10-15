"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownWideNarrow,
  CheckCheck,
  Clock3,
  Inbox,
  Loader2,
  RefreshCw,
  Search,
  Send,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import useMatch from "@/app/hooks/use-match";
import { onFailure, onSuccess } from "@/app/_utils/notification";
import { useAuth } from "@/app/context/AuthContext";
import {
  ActionLoading,
  ConnectionRequest,
} from "@/app/_utils/types/connection";
import RequestCard from "./RequestCard";

type RequestFilter = "pending" | "all" | "sent" | "accepted" | "closed";

const statusOf = (request: ConnectionRequest) =>
  String(request?.status ?? "")
    .trim()
    .toLowerCase();

const isPending = (request: ConnectionRequest) =>
  statusOf(request) === "pending";

const readRequestItems = (payload: any): ConnectionRequest[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.requests)) return payload.requests;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data?.requests)) return payload.data.requests;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const SkeletonRow = () => (
  <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 animate-pulse">
    <div className="h-12 w-12 shrink-0 rounded-full bg-slate-200" />
    <div className="min-w-0 flex-1 space-y-2">
      <div className="h-3 w-36 rounded-full bg-slate-200" />
      <div className="h-2.5 w-52 max-w-full rounded-full bg-slate-100" />
      <div className="h-2.5 w-24 rounded-full bg-slate-100" />
    </div>
    <div className="hidden gap-2 sm:flex">
      <div className="h-9 w-20 rounded-xl bg-slate-100" />
      <div className="h-9 w-20 rounded-xl bg-slate-100" />
    </div>
  </div>
);

function EmptyState({
  filter,
  search,
  onClearSearch,
}: {
  filter: RequestFilter;
  search: string;
  onClearSearch: () => void;
}) {
  const searched = search.trim().length > 0;
  const isPendingFilter = filter === "pending" && !searched;

  return (
    <div className="flex min-h-65 flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 ring-1 ring-slate-100">
        {searched ? (
          <Search className="h-6 w-6 text-slate-400" />
        ) : isPendingFilter ? (
          <CheckCheck className="h-7 w-7 text-emerald-500" />
        ) : (
          <Inbox className="h-7 w-7 text-slate-400" />
        )}
      </div>
      <h3 className="text-base font-semibold text-slate-800">
        {searched
          ? "No matching requests"
          : isPendingFilter
            ? "You're all caught up"
            : filter === "sent"
              ? "No sent requests"
              : filter === "accepted"
                ? "No accepted requests"
                : filter === "closed"
                  ? "No closed requests"
                  : "No connection requests yet"}
      </h3>
      <p className="mt-1.5 max-w-sm text-sm leading-6 text-slate-500">
        {searched
          ? "Try another name, username, or email address."
          : isPendingFilter
            ? "New connection requests that need your attention will appear here."
            : filter === "sent"
              ? "Requests you send to other Bouwnce members will appear here."
              : "Requests will appear here when there is activity to show."}
      </p>
      {searched && (
        <button
          type="button"
          onClick={onClearSearch}
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          <X size={14} /> Clear search
        </button>
      )}
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
        <XCircle size={24} className="text-red-400" />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-700">
          We couldn't load your requests
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Check your connection and try again.
        </p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-700"
      >
        <RefreshCw size={13} /> Try again
      </button>
    </div>
  );
}

export default function RequestsPage() {
  const queryClient = useQueryClient();
  const { authDetails } = useAuth();
  const currentUserId = authDetails?.user?.id;
  const [filter, setFilter] = useState<RequestFilter>("pending");
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<ActionLoading>({});

  const {
    useGetMatchRequests,
    useGetSentMatchRequests,
    respondToMatchRequest,
  } = useMatch();
  const incomingQuery = useGetMatchRequests();
  const sentQuery = useGetSentMatchRequests(100);

  const incomingRecords = useMemo(
    () =>
      (incomingQuery.data?.pages ?? []).flatMap((page: any) =>
        readRequestItems(page),
      ),
    [incomingQuery.data],
  );
  const incomingRequests = useMemo(
    () =>
      incomingRecords.filter((request) => {
        const targetId = request?.target_user?.id ?? request?.target_user_id;
        // /matches/requests is the received-request endpoint. Keep records whose
        // target is the current user, but tolerate older responses missing IDs.
        return !targetId || !currentUserId || targetId === currentUserId;
      }),
    [incomingRecords, currentUserId],
  );

  const sentRequests = useMemo(() => {
    const pages = sentQuery.data?.pages ?? [];
    return pages.flatMap((page: any) => readRequestItems(page));
  }, [sentQuery.data]);

  const requests = useMemo(() => {
    const byId = new Map<string, ConnectionRequest>();
    [...incomingRequests, ...sentRequests].forEach((request, index) => {
      const id =
        request?.request_id ??
        `${request?.requester_id ?? "request"}-${request?.target_user_id ?? index}`;
      if (!byId.has(id)) byId.set(id, request);
    });
    return [...byId.values()];
  }, [incomingRequests, sentRequests]);

  const stats = useMemo(() => {
    const incomingPending = requests.filter((request) => {
      const targetId = request?.target_user?.id ?? request?.target_user_id;
      return isPending(request) && targetId === currentUserId;
    }).length;
    const sentPending = sentRequests.filter(isPending).length;
    const pending = requests.filter(isPending).length;
    const accepted = requests.filter(
      (request) => statusOf(request) === "accepted",
    ).length;
    const closed = requests.filter((request) =>
      ["rejected", "expired", "declined", "cancelled"].includes(
        statusOf(request),
      ),
    ).length;
    return {
      all: requests.length,
      pending,
      incomingPending,
      sentPending,
      accepted,
      closed,
    };
  }, [requests, sentRequests, currentUserId]);

  const filteredRequests = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const filtered = requests.filter((request) => {
      const status = statusOf(request);
      const targetId = request?.target_user?.id ?? request?.target_user_id;
      const isIncoming = targetId === currentUserId;
      const statusMatches =
        filter === "all"
          ? true
          : filter === "pending"
            ? status === "pending"
            : filter === "sent"
              ? !isIncoming
              : filter === "accepted"
                ? status === "accepted"
                : [
                    "rejected",
                    "expired",
                    "declined",
                    "cancelled",
                    "canceled",
                    "withdrawn",
                  ].includes(status);

      if (!statusMatches) return false;
      if (!normalizedSearch) return true;

      const person = isIncoming ? request.requester : request.target_user;
      const searchable = [
        person?.full_name,
        person?.username,
        person?.email,
        request.requester?.full_name,
        request.requester?.username,
        request.requester?.email,
        request.target_user?.full_name,
        request.target_user?.username,
        request.target_user?.email,
        request.note,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalizedSearch);
    });

    return filtered.sort((a, b) => {
      const aPending = isPending(a);
      const bPending = isPending(b);
      if (aPending !== bPending) return aPending ? -1 : 1;
      const aIncoming =
        (a?.target_user?.id ?? a?.target_user_id) === currentUserId;
      const bIncoming =
        (b?.target_user?.id ?? b?.target_user_id) === currentUserId;
      if (aPending && aIncoming !== bIncoming) return aIncoming ? -1 : 1;
      const aTime = new Date(a.created_at ?? 0).getTime();
      const bTime = new Date(b.created_at ?? 0).getTime();
      return (
        (Number.isFinite(bTime) ? bTime : 0) -
        (Number.isFinite(aTime) ? aTime : 0)
      );
    });
  }, [requests, filter, search, currentUserId]);

  const handleRespond = (request_id: string, action: "accept" | "reject") => {
    setActionLoading((previous) => ({ ...previous, [request_id]: action }));

    respondToMatchRequest.mutate(
      { request_id, action },
      {
        onSuccess: () => {
          onSuccess({
            title:
              action === "accept" ? "You're connected" : "Request declined",
            message:
              action === "accept"
                ? "You have accepted the connection request."
                : "The connection request has been declined.",
          });
          queryClient.invalidateQueries({ queryKey: ["matches", "requests"] });
          queryClient.invalidateQueries({ queryKey: ["matches", "list"] });
          queryClient.invalidateQueries({ queryKey: ["matches", "suggest"] });
          queryClient.invalidateQueries({
            queryKey: ["matches", "connection-status"],
          });
        },
        onError: () => {
          onFailure({
            title: "Couldn't update request",
            message: "Something went wrong. Please try again.",
          });
        },
        onSettled: () => {
          setActionLoading((previous) => ({ ...previous, [request_id]: null }));
        },
      },
    );
  };

  const refresh = () => {
    void incomingQuery.refetch();
    void sentQuery.refetch();
  };
  const loading = incomingQuery.isLoading || sentQuery.isLoading;
  const bothFailed = incomingQuery.isError && sentQuery.isError;
  const tabs: { key: RequestFilter; label: string; count: number }[] = [
    { key: "pending", label: "Pending", count: stats.pending },
    { key: "all", label: "All requests", count: stats.all },
    { key: "sent", label: "Sent", count: sentRequests.length },
    { key: "accepted", label: "Accepted", count: stats.accepted },
    { key: "closed", label: "Closed", count: stats.closed },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 pb-8">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="relative px-5 py-6 sm:px-7 sm:py-7">
          <div className="pointer-events-none absolute -right-8 -top-14 h-44 w-44 rounded-full bg-orange-50 blur-2xl" />
          <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div className="min-w-0">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-semibold text-orange-700">
                <Users size={13} /> Your network
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-[28px]">
                Connection requests
              </h1>
              <p className="mt-1.5 max-w-lg text-sm leading-6 text-slate-500">
                Manage incoming requests and keep track of the connections
                you've requested.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-slate-100 bg-white/80 px-4 py-3 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                <Inbox size={19} />
              </div>
              <div>
                <p className="text-2xl font-semibold leading-none text-slate-900">
                  {stats.incomingPending}
                </p>
                <p className="mt-1 text-[11px] font-medium text-slate-500">
                  Awaiting your response
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 border-t border-slate-100 sm:grid-cols-4">
          <div className="flex items-center gap-3 border-b border-r border-slate-100 px-5 py-3.5 sm:border-b-0 sm:px-6">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Clock3 size={17} />
            </span>
            <div>
              <p className="text-lg font-semibold text-slate-900">
                {stats.incomingPending}
              </p>
              <p className="text-[11px] text-slate-500">Needs action</p>
            </div>
          </div>
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3.5 sm:border-b-0 sm:border-r sm:px-6">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
              <Send size={16} />
            </span>
            <div>
              <p className="text-lg font-semibold text-slate-900">
                {stats.sentPending}
              </p>
              <p className="text-[11px] text-slate-500">
                Sent requests pending
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 border-r border-slate-100 px-5 py-3.5 sm:px-6">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCheck size={17} />
            </span>
            <div>
              <p className="text-lg font-semibold text-slate-900">
                {stats.accepted}
              </p>
              <p className="text-[11px] text-slate-500">Accepted</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-5 py-3.5 sm:px-6">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
              <XCircle size={17} />
            </span>
            <div>
              <p className="text-lg font-semibold text-slate-900">
                {stats.closed}
              </p>
              <p className="text-[11px] text-slate-500">Closed</p>
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Your requests
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                {filter === "pending"
                  ? "Incoming requests are prioritized so you can respond quickly."
                  : "Search, review, and manage your connection activity."}
              </p>
            </div>
            <div className="flex w-full items-center gap-2 lg:max-w-sm">
              <label className="relative block min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search name, username, email..."
                  aria-label="Search connection requests"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-9 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
                />
                {search && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                  >
                    <X size={14} />
                  </button>
                )}
              </label>
              <button
                type="button"
                onClick={refresh}
                disabled={incomingQuery.isFetching || sentQuery.isFetching}
                aria-label="Refresh requests"
                title="Refresh requests"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
              >
                <RefreshCw
                  size={15}
                  className={
                    incomingQuery.isFetching || sentQuery.isFetching
                      ? "animate-spin"
                      : ""
                  }
                />
              </button>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-1.5 overflow-x-auto pb-0.5">
            <span className="mr-1 hidden items-center gap-1.5 text-[11px] font-medium text-slate-400 sm:flex">
              <ArrowDownWideNarrow size={13} /> Filter
            </span>
            {tabs.map((tab) => {
              const active = filter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilter(tab.key)}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${active ? "bg-slate-900 text-white shadow-sm" : "bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-800"}`}
                >
                  {tab.label}
                  <span
                    className={`min-w-5 rounded-md px-1.5 py-0.5 text-[10px] ${active ? "bg-white/15 text-white" : "bg-white text-slate-500 ring-1 ring-slate-200"}`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3 p-4 sm:p-5">
          {loading ? (
            <>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </>
          ) : bothFailed ? (
            <ErrorState onRetry={refresh} />
          ) : filteredRequests.length === 0 ? (
            <EmptyState
              filter={filter}
              search={search}
              onClearSearch={() => setSearch("")}
            />
          ) : (
            <>
              <div className="flex items-center justify-between px-1 pb-1">
                <p className="text-xs text-slate-500">
                  Showing{" "}
                  <span className="font-semibold text-slate-700">
                    {filteredRequests.length}
                  </span>{" "}
                  {filteredRequests.length === 1 ? "request" : "requests"}
                </p>
                {filter === "pending" && stats.incomingPending > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-orange-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                    {stats.incomingPending}{" "}
                    {stats.incomingPending === 1 ? "needs" : "need"} your
                    response
                  </span>
                )}
              </div>
              {filteredRequests.map((request, index) => (
                <RequestCard
                  key={
                    request.request_id ??
                    `${request.requester_id}-${request.target_user_id}-${index}`
                  }
                  r={request}
                  actionLoading={actionLoading[request.request_id] ?? null}
                  onAccept={() => handleRespond(request.request_id, "accept")}
                  onReject={() => handleRespond(request.request_id, "reject")}
                />
              ))}
            </>
          )}

          {(incomingQuery.hasNextPage || sentQuery.hasNextPage) && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                disabled={
                  incomingQuery.isFetchingNextPage ||
                  sentQuery.isFetchingNextPage
                }
                onClick={() => {
                  if (incomingQuery.hasNextPage)
                    void incomingQuery.fetchNextPage();
                  if (sentQuery.hasNextPage) void sentQuery.fetchNextPage();
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {incomingQuery.isFetchingNextPage ||
                sentQuery.isFetchingNextPage ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <RefreshCw size={13} />
                )}
                {incomingQuery.isFetchingNextPage ||
                sentQuery.isFetchingNextPage
                  ? "Loading requests..."
                  : "Load more request history"}
              </button>
            </div>
          )}
          {incomingQuery.isError !== sentQuery.isError && (
            <p className="px-1 pt-1 text-center text-[11px] text-amber-700">
              Some request data could not be refreshed. Try refreshing to load
              the latest activity.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

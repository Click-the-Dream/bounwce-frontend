"use client";

import { useMemo, useState } from "react";
import { Users, XCircle } from "lucide-react";
import CardHeader from "../../admin/_components/CardHeader";
import Card from "../../admin/_components/Card";
import useMatch from "@/app/hooks/use-match";
import { useQueryClient } from "@tanstack/react-query";
import { onSuccess, onFailure } from "@/app/_utils/notification";
import {
  ActionLoading,
  ConnectionRequest,
  RequestStatus,
} from "@/app/_utils/types/connection";
import RequestCard from "./_components/RequestCard";

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

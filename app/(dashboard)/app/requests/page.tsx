"use client";

import { useMemo, useState } from "react";
import { Check, X, UserCheck } from "lucide-react";

import CardHeader from "../../admin/_components/CardHeader";
import Card from "../../admin/_components/Card";
import useMatch from "@/app/hooks/use-match";

type RequestStatus = "pending" | "accepted" | "rejected" | "expired";

interface ConnectionRequest {
  request_id: string;
  requester_id: string;
  target_user_id: string;
  status: RequestStatus;
  created_at: string;
  responded_at: string | null;
}

const normalizeStatus = (status: RequestStatus) => {
  if (status === "expired") return "rejected";
  return status;
};

export default function RequestsPage() {
  const [filter, setFilter] = useState<RequestStatus | "all">("all");

  const { useGetMatchRequests } = useMatch();
  const { data } = useGetMatchRequests();

  const requests: ConnectionRequest[] = data || [];

  const filtered = useMemo(() => {
    if (filter === "all") return requests;
    return requests.filter((r) => r.status === filter);
  }, [filter, requests]);

  const stats = {
    all: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    accepted: requests.filter((r) => r.status === "accepted").length,
    rejected: requests.filter((r) => r.status === "expired").length,
  };

  const handleAccept = (id: string) => console.log("accept", id);
  const handleReject = (id: string) => console.log("reject", id);

  return (
    <Card>
      <CardHeader>
        <div>
          <h3 className="font-semibold text-slate-800">Connection Requests</h3>
          <p className="text-xs text-slate-400">
            Manage incoming connection requests
          </p>
        </div>

        {/* FILTERS */}
        <div className="flex gap-2 flex-wrap">
          {[
            { key: "all", label: "All", count: stats.all },
            { key: "pending", label: "Pending", count: stats.pending },
            { key: "accepted", label: "Accepted", count: stats.accepted },
            { key: "rejected", label: "Rejected", count: stats.rejected },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition
                ${
                  filter === tab.key
                    ? "bg-violet-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </CardHeader>

      {/* REQUEST FEED */}
      <div className="px-6 pb-6 space-y-3">
        {filtered.map((r) => (
          <div
            key={r.request_id}
            className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-white hover:shadow-sm transition"
          >
            {/* LEFT SIDE */}
            <div className="flex flex-col">
              <div className="text-sm font-semibold text-slate-800">
                {r.requester_id}
              </div>

              <div className="text-xs text-slate-400 mt-0.5">
                wants to connect with{" "}
                <span className="text-slate-600 font-medium">
                  {r.target_user_id}
                </span>
              </div>

              <div className="text-[11px] text-slate-400 mt-1">
                {new Date(r.created_at).toLocaleString()}
              </div>
            </div>

            {/* RIGHT SIDE */}
            <div className="flex items-center gap-2">
              {r.status === "pending" ? (
                <>
                  <button
                    onClick={() => handleAccept(r.request_id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  >
                    <Check size={14} />
                    Accept
                  </button>

                  <button
                    onClick={() => handleReject(r.request_id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100"
                  >
                    <X size={14} />
                    Reject
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <UserCheck size={14} />
                  {normalizeStatus(r.status)}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* EMPTY STATE */}
        {filtered.length === 0 && (
          <div className="py-16 text-center text-slate-400 text-sm">
            No connection requests found
          </div>
        )}
      </div>
    </Card>
  );
}

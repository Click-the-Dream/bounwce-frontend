"use client";

import { CheckCircle2, Clock3, Link2, ShieldQuestion, XCircle } from "lucide-react";

type ConnectionStatus = {
  status?: string | null;
  is_connected?: boolean;
  request_direction?: string | null;
};

export default function ConnectionStatusBadge({
  data,
  loading,
  failed,
}: {
  data?: ConnectionStatus | null;
  loading?: boolean;
  failed?: boolean;
}) {
  if (loading) return null;
  if (failed || !data) return null;

  const status = String(data.status ?? "").trim().toLowerCase().replace(/[ -]+/g, "_");
  const direction = String(data.request_direction ?? "").trim().toLowerCase();

  let label = "Not connected";
  let className = "border-slate-200 bg-slate-50 text-slate-500";
  let Icon = Link2;

  if (data.is_connected === true) {
    label = "Connected now";
    className = "border-emerald-200 bg-emerald-50 text-emerald-700";
    Icon = CheckCircle2;
  } else if (["pending", "requested", "awaiting_response"].includes(status)) {
    if (["outgoing", "outbound"].includes(direction)) {
      label = "Request sent";
      className = "border-amber-200 bg-amber-50 text-amber-700";
    } else if (["incoming", "inbound"].includes(direction)) {
      label = "Request received";
      className = "border-amber-200 bg-amber-50 text-amber-700";
    } else {
      label = "Request pending";
      className = "border-amber-200 bg-amber-50 text-amber-700";
    }
    Icon = Clock3;
  } else if (["expired", "rejected", "declined", "cancelled", "canceled", "withdrawn"].includes(status)) {
    label = status === "expired" ? "Latest request expired" : "Not connected";
    className = "border-slate-200 bg-slate-50 text-slate-500";
    Icon = XCircle;
  } else if (data.is_connected === false) {
    label = "Not connected";
    className = "border-slate-200 bg-slate-50 text-slate-500";
    Icon = ShieldQuestion;
  } else {
    return null;
  }

  return (
    <span className={`inline-flex w-fit items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${className}`}>
      <Icon size={11} aria-hidden="true" />
      {label}
    </span>
  );
}

"use client";

import { useMemo, useState } from "react";
import {
  Check,
  Clipboard,
  Download,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  TrendingUp,
  UserRoundSearch,
  Users,
  X,
} from "lucide-react";
import Card from "../_components/Card";
import CardHeader from "../_components/CardHeader";
import StatusBadge from "../_components/StatusBadge";
import useWaitlist from "@/app/hooks/use-waitlist";

type WaitlistEntry = {
  id: string;
  full_name: string;
  email: string;
  phone_number?: string;
  location?: string;
  referral_source?: string;
  created_at?: string;
  status: "pending" | "contacted" | "invited";
};

const getEntries = (data: any): WaitlistEntry[] => {
  const raw =
    data?.items ??
    data?.users ??
    data?.waitlist ??
    data?.entries ??
    (Array.isArray(data) ? data : []);

  if (!Array.isArray(raw)) return [];

  return raw.map((item: any, index: number) => ({
    id: String(item.id ?? item._id ?? item.email ?? index),
    full_name: item.full_name ?? item.name ?? "Unknown",
    email: item.email ?? "—",
    phone_number: item.phone_number ?? item.phone ?? "",
    location: item.location ?? item.city ?? "",
    referral_source: item.referral_source ?? item.source ?? "",
    created_at: item.created_at ?? item.createdAt ?? item.joined_at,
    status: item.status ?? "pending",
  }));
};

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString([], {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

function downloadCsv(entries: WaitlistEntry[]) {
  const headers = ["Name", "Email", "Phone", "Location", "Source", "Joined"];
  const rows = entries.map((entry) =>
    [
      entry.full_name,
      entry.email,
      entry.phone_number,
      entry.location,
      entry.referral_source,
      entry.created_at,
    ]
      .map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`)
      .join(","),
  );

  const blob = new Blob([[headers.join(","), ...rows].join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `bouwnce-waitlist-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function AdminWaitlistPage() {
  const { waitlistUser } = useWaitlist();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "today" | "pending">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const entries = useMemo(
    () => getEntries(waitlistUser.data?.waitlists),
    [waitlistUser.data],
  );

  const filtered = useMemo(() => {
    const today = new Date().toDateString();

    return entries.filter((entry) => {
      const query = search.trim().toLowerCase();
      const matchesSearch =
        !query ||
        entry.full_name.toLowerCase().includes(query) ||
        entry.email.toLowerCase().includes(query) ||
        entry.location?.toLowerCase().includes(query);

      const matchesFilter =
        filter === "all" ||
        (filter === "pending" && entry.status === "pending") ||
        (filter === "today" &&
          entry.created_at &&
          new Date(entry.created_at).toDateString() === today);

      return matchesSearch && matchesFilter;
    });
  }, [entries, search, filter]);

  const selected = entries.find((entry) => entry.id === selectedId);

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    return {
      total: Number(waitlistUser.data?.total ?? entries.length),
      today: entries.filter(
        (entry) =>
          entry.created_at &&
          new Date(entry.created_at).toDateString() === today,
      ).length,
      pending: entries.filter((entry) => entry.status === "pending").length,
      locations: new Set(entries.map((entry) => entry.location).filter(Boolean))
        .size,
    };
  }, [entries, waitlistUser.data]);

  if (waitlistUser.isLoading) {
    return (
      <div className="p-8 text-center text-slate-400">Loading waitlist…</div>
    );
  }

  if (waitlistUser.isError) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm font-medium text-red-500">
          Failed to load the waitlist.
        </p>
        <button
          onClick={() => waitlistUser.refetch()}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-orange px-4 py-2 text-xs font-semibold text-white"
        >
          <RefreshCw size={13} /> Try again
        </button>
      </Card>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900">
            Waitlist management
          </h2>
          <p className="mt-1 max-w-2xl text-xs sm:text-sm text-slate-500">
            Monitor sign-ups, understand acquisition sources, and keep track of
            people waiting for early access.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => waitlistUser.refetch()}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw size={13} /> Refresh
          </button>
          <button
            onClick={() => downloadCsv(filtered)}
            className="inline-flex items-center gap-2 rounded-lg bg-orange px-3 py-2 text-xs font-semibold text-white hover:bg-[#ee3d15]"
          >
            <Download size={13} /> Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Total sign-ups", stats.total, Users],
          ["Joined today", stats.today, TrendingUp],
          ["Pending", stats.pending, UserRoundSearch],
          ["Locations", stats.locations, MapPin],
        ].map(([label, value, Icon]: any) => (
          <Card key={label} className="p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-slate-500">{label}</p>
              <Icon size={16} className="text-orange" />
            </div>
            <p className="mt-2 text-xl sm:text-2xl font-semibold text-slate-900">
              {value}
            </p>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <CardHeader>
          <div>
            <h3 className="font-semibold text-slate-800">Waitlist entries</h3>
            <p className="mt-0.5 text-xs text-slate-400">
              Showing {filtered.length} of {entries.length} loaded entries
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <div className="relative min-w-0 sm:w-64">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, email or location…"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs outline-none focus:border-orange focus:bg-white"
              />
            </div>

            <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
              {[
                ["all", "All"],
                ["today", "Today"],
                ["pending", "Pending"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setFilter(key as typeof filter)}
                  className={`rounded-md px-2.5 py-1.5 text-xs font-medium ${
                    filter === key
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="min-w-190 w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {[
                  "Person",
                  "Location",
                  "Source",
                  "Joined",
                  "Status",
                  "Action",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="whitespace-nowrap px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 first:pl-5"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry) => (
                <tr
                  key={entry.id}
                  onClick={() => setSelectedId(entry.id)}
                  className="cursor-pointer border-b border-slate-50 hover:bg-slate-50/70"
                >
                  <td className="px-4 py-3.5 first:pl-5">
                    <div className="min-w-52">
                      <p className="font-medium text-slate-800">
                        {entry.full_name}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {entry.email}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-500">
                    {entry.location || "—"}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-500">
                    {entry.referral_source || "—"}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-xs text-slate-400">
                    {formatDate(entry.created_at)}
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={entry.status} />
                  </td>
                  <td className="px-4 py-3.5">
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        navigator.clipboard?.writeText(entry.email);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      <Clipboard size={12} /> Copy email
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="px-6 py-16 text-center">
              <Users className="mx-auto text-slate-300" size={28} />
              <p className="mt-3 text-sm text-slate-500">
                No waitlist entries found.
              </p>
            </div>
          )}
        </div>
      </Card>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-0 sm:items-center sm:p-4">
          <div className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-orange">
                  Waitlist profile
                </p>
                <h3 className="mt-1 text-lg font-semibold text-slate-900">
                  {selected.full_name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedId(null)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={17} />
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <a
                href={`mailto:${selected.email}`}
                className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 hover:bg-slate-50"
              >
                <Mail size={16} className="text-orange" />
                <div>
                  <p className="text-xs text-slate-400">Email</p>
                  <p className="text-sm font-medium text-slate-800 break-all">
                    {selected.email}
                  </p>
                </div>
              </a>

              {selected.phone_number && (
                <a
                  href={`tel:${selected.phone_number}`}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 hover:bg-slate-50"
                >
                  <Phone size={16} className="text-orange" />
                  <div>
                    <p className="text-xs text-slate-400">Phone</p>
                    <p className="text-sm font-medium text-slate-800">
                      {selected.phone_number}
                    </p>
                  </div>
                </a>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-400">Location</p>
                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {selected.location || "—"}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-400">Joined</p>
                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {formatDate(selected.created_at)}
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-400">Referral source</p>
                <p className="mt-1 text-sm font-medium text-slate-800">
                  {selected.referral_source || "—"}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <a
                  href={`mailto:${selected.email}?subject=Bouwnce%20early%20access`}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-orange px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#ee3d15]"
                >
                  <Mail size={13} /> Contact
                </a>
                <button
                  onClick={() => navigator.clipboard?.writeText(selected.email)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600"
                >
                  <Clipboard size={13} /> Copy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

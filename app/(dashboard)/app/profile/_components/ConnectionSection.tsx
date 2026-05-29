"use client";

import { useState, useMemo } from "react";
import UserImage from "../../_components/UserImage";

// ─── Raw API shape ────────────────────────────────────────────────────────────

interface MatchUser {
  id: string;
  full_name: string;
  username: string;
  bio?: string | null;
  institution?: string | null;
  profile_pic?: { url: string; public_id: string } | null;
  profile_banner?: { url: string; public_id: string } | null;
}

export interface Match {
  match_id: string;
  user: MatchUser;
  target_user: MatchUser;
  status: string;
  accepted_at: string;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ConnectionsSectionProps {
  /** The logged-in user's id — used to determine which side of the match is "the other person" */
  currentUserId?: string;
  isOwnProfile?: boolean;
  matches?: Match[];
  isLoading?: boolean;
  isError?: boolean;
  totalConnections?: number;
  onViewProfile?: (userId: string) => void;
}

// ─── Derive the "other person" from a match ───────────────────────────────────

function resolveConnection(match: Match, currentUserId?: string) {
  // If the current user is the initiator, the connection is target_user; otherwise user.
  const other =
    match.user.id === currentUserId ? match.target_user : match.user;
  return {
    id: other.id,
    full_name: other.full_name.trim(),
    username: other.username.trim(),
    bio: other.bio ?? undefined,
    institution: other.institution ?? undefined,
    profile_pic: other.profile_pic,
    connected_at: match.accepted_at,
    match_id: match.match_id,
  };
}

type ResolvedConnection = ReturnType<typeof resolveConnection>;

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="flex items-center gap-3 py-3.5 animate-pulse">
      <div className="w-11 h-11 rounded-full bg-gray-100 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-32 rounded bg-gray-100" />
        <div className="h-2.5 w-48 rounded bg-gray-100" />
      </div>
      <div className="h-7 w-24 rounded-full bg-gray-100" />
    </div>
  );
}

// ─── Connection Card ──────────────────────────────────────────────────────────

function ConnectionCard({
  connection,
  onViewProfile,
}: {
  connection: ResolvedConnection;
  onViewProfile?: (id: string) => void;
}) {
  const connectedDate = connection.connected_at
    ? new Date(connection.connected_at).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <div
      className="flex items-center gap-3 py-3.5 cursor-pointer group transition-all"
      onClick={() => onViewProfile?.(connection.id)}
    >
      <UserImage
        user={{
          id: connection?.id,
          full_name: connection?.full_name,
          profile_pic: { url: connection?.profile_pic?.url },
        }}
        size={35}
        rounded="rounded-full"
      />

      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-gray-900 truncate group-hover:underline">
          {connection.full_name}
        </p>
        {/* <p className="text-[11px] text-gray-400 truncate">
          @{connection.username}
        </p> */}
        {connection.institution && (
          <p className="text-[10.5px] text-gray-400 truncate mt-0.5">
            {connection.institution}
          </p>
        )}
      </div>

      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className="text-[10px] px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-100 font-medium">
          Connected
        </span>
        {connectedDate && (
          <span className="text-[9.5px] text-gray-300">{connectedDate}</span>
        )}
      </div>
    </div>
  );
}

// ─── Main Section ─────────────────────────────────────────────────────────────

const FILTER_OPTIONS = ["All", "Recent"] as const;
type Filter = (typeof FILTER_OPTIONS)[number];

export default function ConnectionsSection({
  currentUserId,
  isOwnProfile = false,
  matches = [],
  isLoading = false,
  isError = false,
  totalConnections,
  onViewProfile,
}: ConnectionsSectionProps) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<Filter>("All");
  const [showAll, setShowAll] = useState(false);

  const INITIAL_VISIBLE = 5;

  // Resolve the "other person" from each match
  const connections = useMemo(
    () => matches.map((m) => resolveConnection(m, currentUserId)),
    [matches, currentUserId],
  );

  const filtered = useMemo(() => {
    let result = [...connections];

    if (activeFilter === "Recent") {
      result = result.sort(
        (a, b) =>
          new Date(b.connected_at ?? 0).getTime() -
          new Date(a.connected_at ?? 0).getTime(),
      );
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.full_name.toLowerCase().includes(q) ||
          c.username.toLowerCase().includes(q) ||
          c.bio?.toLowerCase().includes(q) ||
          c.institution?.toLowerCase().includes(q),
      );
    }

    return result;
  }, [connections, activeFilter, search]);

  const visible = showAll ? filtered : filtered.slice(0, INITIAL_VISIBLE);
  const count = totalConnections ?? connections.length;

  return (
    <section className="bg-white border border-[#00000014] rounded-xl overflow-hidden mt-4">
      {/* ── Header ── */}
      <div className="px-5 pt-5 pb-3 border-b border-[#00000010]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-[15px] font-bold text-gray-900">Connections</h2>
            {count > 0 && (
              <span className="text-[11px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {count >= 500 ? "500+" : count}
              </span>
            )}
          </div>
          {isOwnProfile && (
            <button className="text-[11px] font-semibold text-black hover:underline">
              Manage
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search connections…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-[12px] border border-[#00000018] rounded-lg bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-black/20 focus:bg-white transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex gap-1.5">
          {FILTER_OPTIONS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`text-[11px] font-medium px-3 py-1 rounded-full border transition-all ${
                activeFilter === f
                  ? "bg-black text-white border-black"
                  : "bg-transparent text-gray-500 border-[#00000018] hover:border-gray-300 hover:text-gray-700"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ── List ── */}
      <div className="px-5 divide-y divide-[#00000008]">
        {isLoading &&
          Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}

        {isError && !isLoading && (
          <div className="py-8 text-center">
            <p className="text-sm text-gray-400">Failed to load connections.</p>
          </div>
        )}

        {!isLoading && !isError && connections.length === 0 && (
          <div className="py-10 flex flex-col items-center justify-center gap-2 text-center">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-1">
              <svg
                className="w-5 h-5 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <p className="text-[13px] font-medium text-gray-500">
              No connections yet
            </p>
            <p className="text-[11px] text-gray-400">
              {isOwnProfile
                ? "Start connecting with people to grow your network."
                : "This user hasn't connected with anyone yet."}
            </p>
          </div>
        )}

        {!isLoading &&
          !isError &&
          connections.length > 0 &&
          filtered.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-[13px] text-gray-400">
                No connections match your search.
              </p>
            </div>
          )}

        {!isLoading &&
          !isError &&
          visible.map((conn) => (
            <ConnectionCard
              key={conn.match_id}
              connection={conn}
              onViewProfile={onViewProfile}
            />
          ))}
      </div>

      {/* ── Show more / less ── */}
      {!isLoading && !isError && filtered.length > INITIAL_VISIBLE && (
        <div className="px-5 pb-5 pt-2 border-t border-[#00000008]">
          <button
            onClick={() => setShowAll((p) => !p)}
            className="w-full text-[12px] font-semibold text-gray-600 hover:text-black py-2 border border-[#00000015] rounded-lg hover:border-gray-300 transition-all"
          >
            {showAll
              ? "Show less"
              : `Show all ${filtered.length} connection${filtered.length !== 1 ? "s" : ""}`}
          </button>
        </div>
      )}
    </section>
  );
}

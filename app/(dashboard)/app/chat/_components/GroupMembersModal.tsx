"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  Loader2,
  Pencil,
  Search,
  Save,
  UserMinus,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import useUser from "@/app/hooks/use-user";
import { useGroupMembers, useGroups } from "@/app/hooks/use-groups";
import type { GroupMember } from "@/app/services/group-chat";
import UserImage from "../../_components/UserImage";
import { useChatUtils } from "@/app/context/ChatContext";

const SEARCH_DEBOUNCE_MS = 350;
const USERS_PAGE_SIZE = 30;

const usersFromPage = (page: any) =>
  page?.items ?? page?.users ?? page?.data?.items ?? page?.data?.users ?? [];

const normalizedName = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : "";

const profileImage = (value: any) => {
  if (typeof value === "string") return value ? { url: value } : undefined;
  if (value && typeof value.url === "string") return { url: value.url };
  return undefined;
};

const memberUser = (member: GroupMember | any) => {
  const nested = member?.user && typeof member.user === "object" ? member.user : null;
  const id = String(member?.user_id ?? nested?.id ?? (!nested ? member?.id : "") ?? "");
  const username = normalizedName(nested?.username ?? member?.username);
  const fullName = normalizedName(nested?.full_name ?? member?.full_name) || username || "Group member";
  return {
    id,
    username,
    full_name: fullName,
    email: nested?.email ?? member?.email ?? null,
    profile_pic: profileImage(nested?.profile_pic ?? member?.profile_pic),
  };
};

export default function GroupMembersModal({
  groupId,
  groupName,
  groupDescription,
  isOpen,
  onClose,
  currentUserId,
}: {
  groupId: string;
  groupName: string;
  groupDescription?: string | null;
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: string;
}) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [error, setError] = useState("");
  const [editingDetails, setEditingDetails] = useState(false);
  const [draftName, setDraftName] = useState(groupName);
  const [draftDescription, setDraftDescription] = useState(groupDescription ?? "");
  const membersListRef = useRef<HTMLDivElement | null>(null);
  const usersLoadMoreRef = useRef<HTMLDivElement | null>(null);
  const fetchingMoreRef = useRef(false);
  const { onlineUsers } = useChatUtils();
  const {
    members: rawMembers,
    isLoading: isLoadingMembers,
    addMember,
    removeMember,
    refetch: refetchMembers,
  } = useGroupMembers(groupId, isOpen);
  const { updateGroup } = useGroups(false);
  const { useGetUsers } = useUser();

  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedSearch(search.trim()),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!isOpen) return;
    setSearch("");
    setDebouncedSearch("");
    setError("");
    setEditingDetails(false);
    setDraftName(groupName);
    setDraftDescription(groupDescription ?? "");
  }, [isOpen, groupId, groupName, groupDescription]);

  const activeMembers = useMemo(
    () => rawMembers.filter((member) => member.is_active !== false),
    [rawMembers],
  );
  const resolvedCurrentUserId = String(currentUserId ?? "");
  const currentMembership = activeMembers.find((member) => {
    const user = memberUser(member);
    return resolvedCurrentUserId && user.id === resolvedCurrentUserId;
  });
  const currentRole = String(currentMembership?.role ?? "").toLowerCase();
  const canManageMembers = !resolvedCurrentUserId || ["owner", "admin", "manager"].includes(currentRole);
  const canEditDetails = ["owner", "admin"].includes(currentRole);

  const params = useMemo(
    () => ({
      page_size: USERS_PAGE_SIZE,
      ...(debouncedSearch ? { name: debouncedSearch } : {}),
    }),
    [debouncedSearch],
  );
  const {
    data: userPages,
    isLoading: isLoadingUsers,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useGetUsers(params, Boolean(isOpen && canManageMembers && !isLoadingMembers));

  const allUsers = useMemo(() => {
    const seen = new Set<string>();
    return (userPages?.pages ?? [])
      .flatMap((page: any) => usersFromPage(page))
      .filter((user: any) => {
        const id = String(user?.id ?? "");
        if (!id || seen.has(id)) return false;
        seen.add(id);
        return true;
      });
  }, [userPages]);
  const memberIds = useMemo(
    () => new Set(activeMembers.map((member) => memberUser(member).id).filter(Boolean)),
    [activeMembers],
  );
  const availableUsers = useMemo(
    () => allUsers.filter((user: any) => {
      const id = String(user?.id ?? "");
      return id && id !== resolvedCurrentUserId && !memberIds.has(id);
    }),
    [allUsers, memberIds, resolvedCurrentUserId],
  );

  useEffect(() => {
    if (!isOpen || !canManageMembers || !hasNextPage || !usersLoadMoreRef.current || !membersListRef.current) return;
    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting) && !isFetchingNextPage && !fetchingMoreRef.current) {
          fetchingMoreRef.current = true;
          void fetchNextPage().finally(() => { fetchingMoreRef.current = false; });
        }
      },
      { root: membersListRef.current, rootMargin: "160px 0px", threshold: 0 },
    );
    observer.observe(usersLoadMoreRef.current);
    return () => observer.disconnect();
  }, [isOpen, canManageMembers, hasNextPage, isFetchingNextPage, fetchNextPage, availableUsers.length]);

  if (!isOpen) return null;

  const handleAdd = async (userId: string) => {
    if (memberIds.has(userId)) return;
    setError("");
    try {
      await addMember.mutateAsync({ userId });
    } catch (err: any) {
      await refetchMembers().catch(() => undefined);
      setError(err?.response?.data?.message ?? err?.message ?? "Unable to add this person.");
    }
  };

  const handleRemove = async (userId: string) => {
    setError("");
    try {
      await removeMember.mutateAsync({ userId });
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? "Unable to remove this person.");
    }
  };

  const saveDetails = async () => {
    if (!draftName.trim()) {
      setError("Group name cannot be empty.");
      return;
    }
    setError("");
    try {
      await updateGroup.mutateAsync({
        groupId,
        input: {
          name: draftName.trim(),
          description: draftDescription.trim(),
        },
      });
      setEditingDetails(false);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? "Unable to update group details.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[75] flex items-center justify-center bg-black/40 p-0 md:p-4"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <section className="flex h-full max-h-[780px] w-full flex-col bg-white shadow-xl md:max-w-lg md:rounded-2xl" aria-label="Group members">
        <header className="flex items-center justify-between border-b px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-orange/10 text-orange"><Users size={20} /></span>
            <div className="min-w-0">
              <h2 className="font-semibold text-gray-900">Group information</h2>
              <p className="max-w-[270px] truncate text-xs text-gray-500">{groupName} · {activeMembers.length} {activeMembers.length === 1 ? "member" : "members"}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-gray-100" aria-label="Close"><X size={18} /></button>
        </header>

        <div ref={membersListRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-3">
          <section className="mb-5 rounded-2xl border border-gray-100 bg-gray-50/80 p-3.5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Group details</h3>
              {canEditDetails && !editingDetails ? (
                <button type="button" onClick={() => { setDraftName(groupName); setDraftDescription(groupDescription ?? ""); setEditingDetails(true); setError(""); }} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-orange hover:bg-orange/10">
                  <Pencil size={13} /> Edit details
                </button>
              ) : null}
            </div>
            {editingDetails ? (
              <div className="space-y-3">
                <label className="block text-xs font-medium text-gray-600">Group name
                  <input value={draftName} onChange={(event) => setDraftName(event.target.value)} maxLength={100} className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange" />
                </label>
                <label className="block text-xs font-medium text-gray-600">Description <span className="font-normal text-gray-400">(optional)</span>
                  <textarea value={draftDescription} onChange={(event) => setDraftDescription(event.target.value)} maxLength={500} rows={2} className="mt-1.5 w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange" />
                </label>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => { setEditingDetails(false); setDraftName(groupName); setDraftDescription(groupDescription ?? ""); }} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-white">Cancel</button>
                  <button type="button" disabled={updateGroup.isPending} onClick={() => void saveDetails()} className="inline-flex items-center gap-1.5 rounded-lg bg-orange px-3 py-2 text-xs font-semibold text-white disabled:opacity-60">
                    {updateGroup.isPending ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                    Save changes
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="break-words text-sm font-semibold text-gray-900">{groupName}</p>
                <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-5 text-gray-500">{groupDescription?.trim() || "No group description yet."}</p>
              </>
            )}
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">People in this group</h3>
              {isLoadingMembers ? <Loader2 size={14} className="animate-spin text-gray-400" /> : <span className="text-[11px] text-gray-400">{activeMembers.length} total</span>}
            </div>
            {isLoadingMembers ? (
              <div className="space-y-3 py-2">{[0, 1, 2].map((item) => <div key={item} className="h-12 animate-pulse rounded-xl bg-gray-100" />)}</div>
            ) : activeMembers.length ? activeMembers.map((member) => {
              const user = memberUser(member);
              const id = user.id;
              if (!id) return null;
              const online = Boolean(onlineUsers?.[id]) || Boolean(member.online);
              const role = normalizedName(member.role).toLowerCase() || "member";
              return (
                <div key={String(member.id ?? id)} className="flex items-center gap-3 rounded-xl px-1 py-2.5">
                  <span className="relative shrink-0">
                    <UserImage user={{ id, full_name: user.full_name, profile_pic: user.profile_pic }} size={39} rounded="rounded-full" clickable={false} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-1.5 truncate text-sm font-medium text-gray-800">
                      <span className="truncate">{user.full_name}</span>
                      {id === resolvedCurrentUserId ? <span className="shrink-0 text-xs font-normal text-gray-400">(you)</span> : null}
                    </p>
                    <div className="flex min-w-0 items-center gap-2 text-xs text-gray-400">
                      <span className="truncate">{user.username ? `@${user.username}` : user.email ?? "Member"}</span>
                      {online ? <span className="inline-flex shrink-0 items-center gap-1 font-medium text-emerald-600"><span className="size-1.5 rounded-full bg-emerald-500" />Online</span> : null}
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold capitalize ${role === "owner" ? "bg-orange/10 text-orange" : role === "admin" ? "bg-violet-50 text-violet-600" : "bg-gray-100 text-gray-500"}`}>
                    {role}
                  </span>
                  {canManageMembers && id !== resolvedCurrentUserId ? (
                    <button type="button" disabled={removeMember.isPending} onClick={() => void handleRemove(id)} title={`Remove ${user.full_name}`} aria-label={`Remove ${user.full_name}`} className="rounded-full p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-50"><UserMinus size={16} /></button>
                  ) : null}
                </div>
              );
            }) : (
              <p className="rounded-xl bg-gray-50 px-3 py-5 text-center text-sm text-gray-400">No active members found.</p>
            )}
          </section>

          {canManageMembers ? (
            <section className="mt-5 border-t border-gray-100 pt-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Add people</h3>
                  <p className="mt-0.5 text-[11px] text-gray-400">Members already in this group are hidden.</p>
                </div>
                {isFetchingNextPage ? <Loader2 size={14} className="animate-spin text-orange" /> : null}
              </div>
              <div className="relative mb-2">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search people" className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-9 text-sm outline-none transition focus:border-orange" />
                {search ? <button type="button" onClick={() => setSearch("")} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:bg-gray-100"><X size={14} /></button> : null}
              </div>

              {isLoadingUsers ? (
                <p className="py-5 text-center text-xs text-gray-400">Searching people…</p>
              ) : availableUsers.length ? availableUsers.map((user: any) => {
                const id = String(user.id);
                return (
                  <div key={id} className="flex items-center gap-3 rounded-xl px-1 py-2.5">
                    <UserImage user={{ ...user, id, full_name: normalizedName(user.full_name) || normalizedName(user.username) || "User", profile_pic: profileImage(user.profile_pic) }} size={36} rounded="rounded-full shrink-0" clickable={false} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-800">{normalizedName(user.full_name) || normalizedName(user.username) || "User"}</p>
                      <p className="truncate text-xs text-gray-400">{normalizedName(user.username) ? `@${normalizedName(user.username)}` : user.email ?? ""}</p>
                    </div>
                    {!memberIds.has(id) ? (
                      <button type="button" disabled={addMember.isPending} onClick={() => void handleAdd(id)} className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-orange/10 px-3 py-1.5 text-xs font-semibold text-orange transition hover:bg-orange/15 disabled:opacity-50"><UserPlus size={13} /> Add</button>
                    ) : <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1.5 text-[11px] font-medium text-emerald-600"><Check size={12} /> Added</span>}
                  </div>
                );
              }) : (
                <p className="py-6 text-center text-xs text-gray-400">{debouncedSearch ? "No matching people found." : "No additional people to add."}</p>
              )}
              <div ref={usersLoadMoreRef} className="flex min-h-8 items-center justify-center py-2">
                {isFetchingNextPage ? <Loader2 size={15} className="animate-spin text-orange" /> : hasNextPage ? <span className="text-[10px] text-gray-300">Scroll to load more</span> : null}
              </div>
            </section>
          ) : null}
        </div>

        {error ? <p role="alert" className="border-t border-red-100 bg-red-50 px-5 py-3 text-xs text-red-600">{error}</p> : null}
        <footer className="border-t p-4">
          <button type="button" onClick={onClose} className="w-full rounded-xl bg-gray-100 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-200">Done</button>
        </footer>
      </section>
    </div>
  );
}

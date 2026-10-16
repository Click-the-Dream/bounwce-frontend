"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Check, Search, Users, X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import useUser from "@/app/hooks/use-user";
import { useGroups } from "@/app/hooks/use-groups";
import { useAuth } from "@/app/context/AuthContext";
import UserImage from "../../_components/UserImage";

const SEARCH_DEBOUNCE_MS = 350;
const USERS_PAGE_SIZE = 30;

const usersFromPage = (page: any) =>
  page?.items ?? page?.users ?? page?.data?.items ?? page?.data?.users ?? [];

export default function CreateGroupModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { authDetails } = useAuth();
  const currentUserId = String(authDetails?.user?.id ?? "");
  const { useGetUsers } = useUser();
  const { createGroup } = useGroups(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Record<string, any>>({});
  const [error, setError] = useState("");
  const userListRef = useRef<HTMLDivElement | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const fetchingMoreRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedSearch(search.trim()),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [search]);

  const params = useMemo(
    () => ({
      page_size: USERS_PAGE_SIZE,
      ...(debouncedSearch ? { name: debouncedSearch } : {}),
    }),
    [debouncedSearch],
  );
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useGetUsers(params, isOpen);
  const users = useMemo(() => {
    const seen = new Set<string>();
    return (data?.pages ?? [])
      .flatMap((page: any) => usersFromPage(page))
      .filter((user: any) => {
        const id = String(user?.id ?? "");
        if (!id || id === currentUserId || seen.has(id)) return false;
        seen.add(id);
        return true;
      });
  }, [data, currentUserId]);

  useEffect(() => {
    if (!isOpen) return;
    setName("");
    setDescription("");
    setSearch("");
    setDebouncedSearch("");
    setSelectedIds([]);
    setSelectedUsers({});
    setError("");
  }, [isOpen]);

  useEffect(() => {
    if (userListRef.current) userListRef.current.scrollTop = 0;
  }, [debouncedSearch]);

  useEffect(() => {
    if (!isOpen || !hasNextPage || !loadMoreRef.current || !userListRef.current) return;
    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting) && !isFetchingNextPage && !fetchingMoreRef.current) {
          fetchingMoreRef.current = true;
          void fetchNextPage().finally(() => { fetchingMoreRef.current = false; });
        }
      },
      { root: userListRef.current, rootMargin: "140px 0px", threshold: 0 },
    );
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [isOpen, hasNextPage, isFetchingNextPage, fetchNextPage, users.length]);

  if (!isOpen) return null;

  const toggleUser = (user: any) => {
    const userId = String(user?.id ?? "");
    if (!userId) return;
    const wasSelected = selectedIds.includes(userId);
    setSelectedIds((old) => wasSelected ? old.filter((id) => id !== userId) : [...old, userId]);
    setSelectedUsers((old) => {
      if (wasSelected) {
        const next = { ...old };
        delete next[userId];
        return next;
      }
      return { ...old, [userId]: user };
    });
  };

  const removeSelectedUser = (userId: string) => {
    setSelectedIds((old) => old.filter((id) => id !== userId));
    setSelectedUsers((old) => {
      const next = { ...old };
      delete next[userId];
      return next;
    });
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Enter a group name.");
      return;
    }
    if (selectedIds.length < 1) {
      setError("Select at least one person to start the group.");
      return;
    }
    try {
      const group = await createGroup.mutateAsync({
        name: name.trim(),
        description: description.trim(),
        member_ids: [...new Set(selectedIds.filter((id) => id !== currentUserId))],
      });
      const groupId = group?.id ?? group?.group_id;
      if (!groupId)
        throw new Error(
          "The group was created, but the response did not include its ID. Refresh the group list.",
        );
      onClose();
      router.push(`/app/chat?groupId=${encodeURIComponent(String(groupId))}`);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          err?.message ??
          "Could not create the group. Please try again.",
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center bg-black/40 p-0 md:p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={submit}
        className="flex h-full max-h-190 w-full flex-col bg-white shadow-xl md:max-w-lg md:rounded-2xl"
        aria-label="Create group chat"
      >
        <header className="flex items-start justify-between border-b-[0.53px] border-[#0000002b] px-5 py-3">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-full bg-orange/10 text-orange">
              <Users size={18} />
            </div>
            <div>
              <h2 className="text-[13px] font-medium text-black">Create a group</h2>
              <p className="text-xs text-gray-500">Choose a name and add people.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-gray-100" aria-label="Close">
            <X size={18} />
          </button>
        </header>

        <div className="space-y-3 px-5 pt-4">
          <label className="block text-xs font-medium text-gray-600">
            Group name <span className="text-red-500">*</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={100}
              placeholder="e.g. Weekend plans"
              className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[13px] outline-none focus:border-orange"
            />
          </label>
          <label className="block text-xs font-medium text-gray-600">
            Description <span className="font-normal text-gray-400">(optional)</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={500}
              rows={2}
              placeholder="What is this group for?"
              className="mt-1.5 w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-[13px] outline-none focus:border-orange"
            />
          </label>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search people to add"
              className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-[13px] outline-none focus:border-orange"
            />
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Add participants</span>
            <span>{selectedIds.length} selected</span>
          </div>
          {selectedIds.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {selectedIds.map((id) => {
                const user = selectedUsers[id] ?? users.find((item: any) => String(item.id) === id);
                return (
                  <button
                    type="button"
                    key={id}
                    onClick={() => removeSelectedUser(id)}
                    className="inline-flex max-w-full items-center gap-1 rounded-full bg-orange/10 px-2.5 py-1 text-[11px] font-medium text-orange hover:bg-orange/15"
                    title="Remove selected participant"
                  >
                    <span className="max-w-40 truncate">{user?.full_name ?? user?.username ?? "Selected person"}</span>
                    <X size={12} />
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        <div ref={userListRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-2">
          {isLoading ? (
            <p className="py-8 text-center text-[13px] text-gray-400">Loading people…</p>
          ) : users.length ? (
            users.map((user: any) => {
              const id = String(user.id);
              const selected = selectedIds.includes(id);
              return (
                <button
                  type="button"
                  key={id}
                  onClick={() => toggleUser(user)}
                  className={`flex w-full items-center gap-2 rounded-xl px-1 py-2 text-left hover:bg-gray-50 ${selected ? "bg-orange/5" : ""}`}
                >
                  <UserImage user={user} size={36} rounded="rounded-full shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-gray-800">{user.full_name?.trim?.() || user.username?.trim?.() || "User"}</span>
                    <span className="block truncate text-xs text-gray-400">{user.username?.trim?.() ? `@${user.username.trim()}` : user.email ?? ""}</span>
                  </span>
                  <span className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${selected ? "border-orange bg-orange text-white" : "border-gray-300 text-transparent"}`}>
                    <Check size={13} />
                  </span>
                </button>
              );
            })
          ) : (
            <p className="py-8 text-center text-[13px] text-gray-400">No people found.</p>
          )}
          <div ref={loadMoreRef} className="flex min-h-8 items-center justify-center py-2">
            {isFetchingNextPage ? <Loader2 size={16} className="animate-spin text-orange" /> : null}
          </div>
        </div>

        {error ? <p role="alert" className="px-5 pb-2 text-[13px] text-red-600">{error}</p> : null}
        <footer className="grid grid-cols-2 gap-2 border-t p-4">
          <button type="button" onClick={onClose} className="rounded-xl border border-gray-200 py-2.5 text-[13px] font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={createGroup.isPending || selectedIds.length === 0} className="rounded-xl bg-orange py-2.5 text-[13px] font-semibold text-white disabled:opacity-60">
            {createGroup.isPending ? "Creating…" : "Create group"}
          </button>
        </footer>
      </form>
    </div>
  );
}

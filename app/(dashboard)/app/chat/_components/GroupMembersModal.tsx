"use client";

import { useMemo, useState } from "react";
import { Search, Users, X, UserPlus, UserMinus } from "lucide-react";
import useUser from "@/app/hooks/use-user";
import { useGroupMembers } from "@/app/hooks/use-groups";
import UserImage from "../../_components/UserImage";
import { useChatUtils } from "@/app/context/ChatContext";

export default function GroupMembersModal({ groupId, groupName, isOpen, onClose, currentUserId }: {
  groupId: string; groupName: string; isOpen: boolean; onClose: () => void; currentUserId?: string;
}) {
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const { onlineUsers } = useChatUtils();
  const { members, isLoading, addMember, removeMember } = useGroupMembers(groupId, isOpen);
  const { useGetUsers } = useUser();
  const params = useMemo(() => ({ page_size: 30, ...(search.trim() ? { name: search.trim() } : {}) }), [search]);
  const { data } = useGetUsers(params);
  const allUsers = data?.pages?.flatMap((page: any) => page?.users ?? page?.items ?? []) ?? [];
  const memberIds = new Set(members.map((member: any) => String(member.user_id ?? member.id ?? member.user?.id ?? "")));
  const availableUsers = allUsers.filter((user: any) => user?.id && !memberIds.has(String(user.id)) && String(user.id) !== String(currentUserId ?? ""));

  if (!isOpen) return null;

  const handleAdd = async (userId: string) => {
    setError("");
    try { await addMember.mutateAsync({ userId }); }
    catch (err: any) { setError(err?.response?.data?.message ?? err?.message ?? "Unable to add this person."); }
  };
  const handleRemove = async (userId: string) => {
    setError("");
    try { await removeMember.mutateAsync({ userId }); }
    catch (err: any) { setError(err?.response?.data?.message ?? err?.message ?? "Unable to remove this person."); }
  };

  return <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/40 p-0 md:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="flex h-full max-h-[760px] w-full flex-col bg-white shadow-xl md:max-w-lg md:rounded-2xl" aria-label="Group members">
      <header className="flex items-center justify-between border-b px-5 py-4"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-full bg-orange/10 text-orange"><Users size={20}/></span><div><h2 className="font-semibold text-gray-900">Group members</h2><p className="max-w-[260px] truncate text-xs text-gray-500">{groupName} · {members.length} people</p></div></div><button onClick={onClose} className="rounded-full p-2 hover:bg-gray-100" aria-label="Close"><X size={18}/></button></header>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">People in this group</h3>
        {isLoading ? <p className="py-5 text-sm text-gray-400">Loading members…</p> : members.map((member: any) => {
          const id = String(member.user_id ?? member.id ?? member.user?.id ?? "");
          const user = member.user ?? member;
          if (!id) return null;
          return <div key={id} className="flex items-center gap-3 rounded-xl px-1 py-2">
            <span className="relative shrink-0"><UserImage user={{ ...user, id }} size={37} rounded="rounded-full"/>{onlineUsers[id] ? <span title="Online" className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-white bg-emerald-500"/> : null}</span>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-gray-800">{user.full_name ?? user.username ?? "Group member"} {id === String(currentUserId ?? "") ? <span className="text-xs font-normal text-gray-400">(you)</span> : null}</p><p className="truncate text-xs text-gray-400">{onlineUsers[id] ? "Online" : user.username ? `@${user.username}` : user.email ?? member.role ?? "Member"}</p></div>
            {id !== String(currentUserId ?? "") ? <button disabled={removeMember.isPending} onClick={() => void handleRemove(id)} title="Remove member" className="rounded-full p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"><UserMinus size={16}/></button> : null}
          </div>;
        })}
        <div className="my-4 border-t"/>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Add people</h3>
        <div className="relative mb-2"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search people" className="w-full rounded-xl border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-orange"/></div>
        {availableUsers.slice(0, 25).map((user: any) => <div key={user.id} className="flex items-center gap-3 rounded-xl px-1 py-2"><UserImage user={user} size={36} rounded="rounded-full shrink-0"/><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-gray-800">{user.full_name ?? user.username ?? "User"}</p><p className="truncate text-xs text-gray-400">{user.username ? `@${user.username}` : user.email ?? ""}</p></div><button disabled={addMember.isPending} onClick={() => void handleAdd(String(user.id))} className="flex items-center gap-1 rounded-full bg-orange/10 px-3 py-1.5 text-xs font-semibold text-orange hover:bg-orange/15 disabled:opacity-50"><UserPlus size={13}/> Add</button></div>)}
      </div>
      {error ? <p role="alert" className="border-t px-5 py-3 text-sm text-red-600">{error}</p> : null}
      <footer className="border-t p-4"><button onClick={onClose} className="w-full rounded-xl bg-gray-100 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-200">Done</button></footer>
    </section>
  </div>;
}

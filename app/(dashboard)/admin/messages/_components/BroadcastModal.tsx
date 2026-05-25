"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { Send, X, Search, Users, User } from "lucide-react";
import useUser from "@/app/hooks/use-user";
import useAdmin from "@/app/hooks/use-admin";
import { UserOption } from "@/app/_utils/types/buyer";
import UserSelect from "./UserSelect";

type RecipientMode = "all" | "specific";

interface BroadcastModalProps {
  onClose: () => void;
  onSent?: () => void;
}

export default function BroadcastModal({
  onClose,
  onSent,
}: BroadcastModalProps) {
  const { broadcastMessage } = useAdmin();
  const { useGetUsers } = useUser();

  const [mode, setMode] = useState<RecipientMode>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<UserOption[]>([]);
  const [message, setMessage] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const observer = useRef<IntersectionObserver | null>(null);

  const params = useMemo(() => ({ page_size: 20, name: query }), [query]);
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useGetUsers(params);

  const users: UserOption[] =
    data?.pages?.flatMap((page: any) => page.users || []) || [];
  const totalUsers = data?.pages?.[0]?.total ?? users.length;

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [message]);

  const lastUserRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetchingNextPage) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) fetchNextPage();
      });
      if (node) observer.current.observe(node);
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage],
  );

  const toggle = (user: UserOption) => {
    setSelected((prev) =>
      prev.find((u) => u.id === user.id)
        ? prev.filter((u) => u.id !== user.id)
        : [...prev, user],
    );
  };

  const isSelected = (id: string) => selected.some((u) => u.id === id);

  const canSend =
    message.trim().length > 0 && (mode === "all" || selected.length > 0);

  const handleSend = () => {
    if (!canSend) return;
    const user_ids = mode === "all" ? null : selected.map((u) => u.id);
    const all_users = mode === "all" ? true : false;
    broadcastMessage.mutate(
      { all_users, user_ids, body: message.trim() },
      {
        onSuccess: () => {
          onSent?.();
          onClose();
        },
      },
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 backdrop-blur-sm px-4">
      <div className="bg-white h-full w-full md:max-h-[90vh] md:max-w-lg md:rounded-2xl shadow-xl flex flex-col overflow-hidden">
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b-[0.53px] border-[#00000033] shrink-0">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-sm font-medium text-black">
                Broadcast Message
              </h2>
              <span className="text-[10px] bg-orange/10 text-orange px-2 py-1 rounded-full font-medium">
                Sends to DMs
              </span>
            </div>
            <p className="text-[13px] text-[#00000080] mt-0.5">
              Send a message directly to users' chat inbox
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* ── Recipient toggle — always visible, never scrolls away ── */}
        <div className="px-5 pt-4 pb-3 border-b-[0.53px] border-[#00000033] shrink-0 flex flex-col gap-2">
          <label className="text-[10px] font-semibold text-[#9C9C9C] uppercase tracking-wide">
            Recipients
          </label>

          <div className="flex gap-2">
            <button
              onClick={() => setMode("all")}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium border transition-all ${
                mode === "all"
                  ? "bg-orange text-white border-orange"
                  : "bg-white text-gray-500 border-[#0000004D] hover:border-gray-400"
              }`}
            >
              <Users size={13} />
              All Users
            </button>

            <button
              onClick={() => setMode("specific")}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium border transition-all ${
                mode === "specific"
                  ? "bg-orange text-white border-orange"
                  : "bg-white text-gray-500 border-[#0000004D] hover:border-gray-400"
              }`}
            >
              <User size={13} />
              Specific Users
            </button>
          </div>

          {/* All users summary */}
          {mode === "all" && (
            <p className="text-[11px] text-[#9C9C9C]">
              This message will be sent to all{" "}
              <span className="font-semibold text-gray-600">
                {totalUsers} users
              </span>{" "}
              on the platform.
            </p>
          )}

          {/* Specific — selected chips + search always pinned here */}
          {mode === "specific" && (
            <div className="flex flex-col gap-2">
              {/* Chips */}
              {selected.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selected.map((u) => (
                    <span
                      key={u.id}
                      className="flex items-center gap-1.5 bg-orange/10 text-orange text-[11px] font-medium px-2.5 py-1 rounded-full"
                    >
                      {u.full_name.split(" ")[0]}
                      <button
                        onClick={() => toggle(u)}
                        className="hover:text-red-500 transition-colors"
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9C9C9C] size-4" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-white border-[0.53px] border-[#0000004D] rounded-[10px] py-2.5 pl-10 pr-4 text-sm focus:outline-none placeholder:text-[#9C9C9C]"
                />
              </div>

              {selected.length > 0 && (
                <p className="text-[11px] text-[#9C9C9C]">
                  {selected.length} user{selected.length > 1 ? "s" : ""}{" "}
                  selected
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── User list — scrollable middle section, only in specific mode ── */}
        {mode === "specific" && (
          <UserSelect
            isLoading={isLoading}
            users={users}
            lastUserRef={lastUserRef}
            isSelected={isSelected}
            isFetchingNextPage={isFetchingNextPage}
            toggle={toggle}
          />
        )}

        {/* ── Spacer when in "all" mode so compose sits at bottom ── */}
        {mode === "all" && <div className="flex-1" />}

        {/* ── Compose — always pinned to bottom, never scrolls away ── */}
        <div className="shrink-0 border-t-[0.53px] border-[#00000033] px-4 py-3 flex flex-col gap-2">
          <div className="flex items-end gap-3 bg-[#F7F7F7] rounded-2xl px-4 py-3 border-[0.53px] border-[#0000001A]">
            <textarea
              ref={textareaRef}
              rows={1}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={500}
              placeholder="Write your message..."
              className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-[#9C9C9C] resize-none outline-none leading-relaxed min-h-[24px] max-h-[160px] overflow-y-auto"
            />

            <button
              onClick={handleSend}
              disabled={!canSend || broadcastMessage.isPending}
              className="shrink-0 w-8 h-8 rounded-full bg-orange hover:bg-[#ee3d15] flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {broadcastMessage.isPending ? (
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send size={13} className="text-white" />
              )}
            </button>
          </div>

          {/* Footer meta row */}
          <div className="flex items-center justify-between px-1">
            <p className="text-[10px] text-[#9C9C9C]">
              {mode === "all"
                ? `Sending to all ${totalUsers} users · `
                : selected.length > 0
                  ? `Sending to ${selected.length} user${selected.length > 1 ? "s" : ""} · `
                  : "Select users above · "}
              Enter to send
            </p>
            <span
              className={`text-[10px] transition-colors ${message.length > 450 ? "text-orange" : "text-[#9C9C9C]"}`}
            >
              {message.length}/500
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

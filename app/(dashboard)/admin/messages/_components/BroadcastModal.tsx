"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { Send, X, Search, Users, User, Check } from "lucide-react";
import SafeImage from "@/app/_components/SafeImage";
import useUser from "@/app/hooks/use-user";
import useAdmin from "@/app/hooks/use-admin";

type RecipientMode = "all" | "specific";

interface UserOption {
  id: string;
  full_name: string;
  email?: string;
  username?: string;
  profile?: { url: string };
}

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

  const observer = useRef<IntersectionObserver | null>(null);

  // Mirror NewChatModal's pattern exactly — search is server-side via the name param
  const params = useMemo(() => ({ page_size: 20, name: query }), [query]);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useGetUsers(params);

  const users: UserOption[] =
    data?.pages?.flatMap((page: any) => page.users || []) || [];

  // Infinite scroll — same IntersectionObserver pattern as NewChatModal
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

  // Total user count from first page meta if available, else fallback to loaded count
  const totalUsers = data?.pages?.[0]?.total ?? users.length;

  const canSend =
    message.trim().length > 0 && (mode === "all" || selected.length > 0);

  const handleSend = () => {
    if (!canSend) return;
    const user_ids =
      mode === "all" ? users.map((u) => u.id) : selected.map((u) => u.id);
    broadcastMessage.mutate(
      { user_ids, body: message.trim() },
      {
        onSuccess: () => {
          onSent?.();
          onClose();
        },
      },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 backdrop-blur-sm px-4">
      <div className="bg-white h-full w-full md:min-h-40 md:max-h-[90vh] md:max-w-lg md:rounded-2xl shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
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

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">
          {/* Recipient mode toggle */}
          <div className="flex flex-col gap-2">
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

            {mode === "all" && (
              <p className="text-[11px] text-[#9C9C9C]">
                This message will be sent to all{" "}
                <span className="font-semibold text-gray-600">
                  {totalUsers} users
                </span>{" "}
                on the platform.
              </p>
            )}
          </div>

          {/* User picker — specific mode only */}
          {mode === "specific" && (
            <div className="flex flex-col gap-2.5">
              {/* Selected chips */}
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

              {/* User list */}
              <div className="max-h-52 overflow-y-auto rounded-[10px] border-[0.53px] border-[#0000004D] divide-y divide-[#0000001A]">
                {isLoading ? (
                  <p className="text-xs text-gray-400 text-center py-4">
                    Loading users...
                  </p>
                ) : users.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">
                    No users found
                  </p>
                ) : (
                  users.map((u, index) => {
                    const isLast = index === users.length - 1;
                    return (
                      <div key={u.id} ref={isLast ? lastUserRef : null}>
                        <button
                          onClick={() => toggle(u)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left"
                        >
                          {/* Avatar — mirrors NewChatModal exactly */}
                          <div className="relative size-9 rounded-[10px] bg-gray-200 shrink-0 overflow-hidden">
                            {u.profile?.url ? (
                              <SafeImage
                                src={u.profile.url}
                                alt={u.full_name}
                                width={36}
                                height={36}
                                className="w-full h-full object-cover rounded-[10px]"
                              />
                            ) : (
                              <div className="w-full h-full rounded-[10px] bg-gray-100 flex items-center justify-center font-bold text-black text-xs">
                                {u.full_name?.slice(0, 2) || "NA"}
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">
                              {u.full_name}
                            </p>
                            <p className="text-xs text-[#9C9C9C] truncate">
                              {u.username ? `@${u.username}` : u.email}
                            </p>
                          </div>

                          {/* Checkbox */}
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                              isSelected(u.id)
                                ? "bg-orange border-orange"
                                : "border-[#0000004D]"
                            }`}
                          >
                            {isSelected(u.id) && (
                              <Check size={9} className="text-white" />
                            )}
                          </div>
                        </button>
                      </div>
                    );
                  })
                )}

                {isFetchingNextPage && (
                  <p className="text-xs text-gray-400 text-center py-3">
                    Loading more...
                  </p>
                )}
              </div>

              {selected.length > 0 && (
                <p className="text-[11px] text-[#9C9C9C]">
                  {selected.length} user{selected.length > 1 ? "s" : ""}{" "}
                  selected
                </p>
              )}
            </div>
          )}

          {/* Message */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-semibold text-[#9C9C9C] uppercase tracking-wide">
              Message
            </label>
            <textarea
              className="w-full border-[0.53px] border-[#0000004D] rounded-[10px] px-4 py-3 text-sm focus:outline-none resize-none min-h-[110px] placeholder:text-[#9C9C9C]"
              placeholder="Write your message..."
              value={message}
              maxLength={500}
              onChange={(e) => setMessage(e.target.value)}
            />
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-[#9C9C9C]">
                Delivered directly to each user's chat inbox
              </p>
              <span className="text-[10px] text-[#9C9C9C]">
                {message.length}/500
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 grid grid-cols-2 gap-2.25 mt-auto border-t-[0.53px] border-[#00000033] shrink-0">
          <button
            onClick={onClose}
            className="cursor-pointer py-2 border rounded-[10px] text-sm text-gray-500 hover:bg-stone-50 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleSend}
            disabled={!canSend || broadcastMessage.isPending}
            className="cursor-pointer py-2 bg-[#FF4D2D] hover:bg-[#ee3d15] text-white rounded-[10px] text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-40 transition-all"
          >
            {broadcastMessage.isPending ? (
              <>
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send size={13} />
                {mode === "all"
                  ? `Send to all ${totalUsers}`
                  : `Send to ${selected.length || 0}`}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

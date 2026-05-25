"use client";

import { useState } from "react";
import { Send, X, Search, Users, User, Check } from "lucide-react";
import useAdmin from "@/app/hooks/useAdmin";

interface UserOption {
  id: string;
  full_name: string;
  email: string;
  profile_pic?: { url: string };
}

interface BroadcastModalProps {
  users: UserOption[];
  onClose: () => void;
  onSent?: () => void;
}

type RecipientMode = "all" | "specific";

export default function BroadcastModal({
  users,
  onClose,
  onSent,
}: BroadcastModalProps) {
  const { broadcastMessage } = useAdmin();

  const [mode, setMode] = useState<RecipientMode>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<UserOption[]>([]);
  const [message, setMessage] = useState("");

  const filtered =
    query.length > 0
      ? users.filter(
          (u) =>
            u.full_name.toLowerCase().includes(query.toLowerCase()) ||
            u.email.toLowerCase().includes(query.toLowerCase()),
        )
      : users.slice(0, 8); // show first 8 as suggestions when no query

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="bg-white rounded-2xl w-full max-w-lg flex flex-col overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-[0.53px] border-[#00000033]">
          <div className="flex items-center gap-3">
            <h2 className="text-[15px] font-semibold">Broadcast Message</h2>
            <span className="text-[10px] bg-orange/10 text-orange px-2 py-1 rounded-full font-medium">
              Sends to DMs
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-5 px-6 py-5">
          {/* Recipient toggle */}
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
                  {users.length} users
                </span>{" "}
                on the platform.
              </p>
            )}
          </div>

          {/* User picker — only shown in specific mode */}
          {mode === "specific" && (
            <div className="flex flex-col gap-2">
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
                  className="w-full bg-white border-[0.53px] border-[#0000004D] rounded-[10px] py-2 pl-10 pr-4 text-sm focus:outline-none placeholder:text-[#9C9C9C]"
                />
              </div>

              {/* User list */}
              <div className="max-h-44 overflow-y-auto rounded-[10px] border-[0.53px] border-[#0000004D] divide-y divide-[#0000001A]">
                {filtered.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">
                    No users found
                  </p>
                ) : (
                  filtered.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => toggle(u)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-stone-50 transition-colors text-left"
                    >
                      {/* Avatar */}
                      <div className="w-7 h-7 rounded-full bg-orange/10 flex items-center justify-center shrink-0 overflow-hidden">
                        {u.profile_pic?.url ? (
                          <img
                            src={u.profile_pic.url}
                            alt={u.full_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-[10px] font-bold text-orange">
                            {u.full_name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-800 truncate">
                          {u.full_name}
                        </p>
                        <p className="text-[10px] text-[#9C9C9C] truncate">
                          {u.email}
                        </p>
                      </div>

                      {/* Check */}
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
                  ))
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
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t-[0.53px] border-[#00000033]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium border-[0.53px] border-[#0000004D] rounded-full text-gray-500 hover:bg-stone-50 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleSend}
            disabled={!canSend || broadcastMessage.isPending}
            className="flex items-center gap-2 px-5 py-2 text-xs font-medium bg-orange hover:bg-[#ee3d15] text-white rounded-full disabled:opacity-40 transition-all"
          >
            {broadcastMessage.isPending ? (
              <>
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send size={12} />
                {mode === "all"
                  ? `Broadcast to all ${users.length} users`
                  : `Send to ${selected.length} user${selected.length !== 1 ? "s" : ""}`}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { AtSign } from "lucide-react";

export interface GroupMentionOption {
  id: string;
  username: string;
  fullName: string;
  avatar?: string | null;
}

export default function GroupMentionPicker({
  query,
  members,
  onSelect,
}: {
  query: string;
  members: GroupMentionOption[];
  onSelect: (member: GroupMentionOption) => void;
}) {
  const normalized = query.trim().replace(/^@/, "").toLowerCase();
  const options = members
    .filter((member) => {
      const username = member.username.toLowerCase();
      const fullName = member.fullName.toLowerCase();
      return !normalized || username.includes(normalized) || fullName.includes(normalized);
    })
    .slice(0, 6);

  if (!options.length) return null;

  return (
    <div
      role="listbox"
      aria-label="Mention a group member"
      className="absolute bottom-full left-0 z-40 mb-2 max-h-64 w-full overflow-y-auto rounded-2xl border border-gray-200 bg-white p-1.5 shadow-xl"
    >
      <p className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
        Mention someone
      </p>
      {options.map((member) => (
        <button
          key={member.id}
          type="button"
          role="option"
          aria-selected={false}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onSelect(member)}
          className="flex min-h-11 w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition hover:bg-orange/5 focus:bg-orange/5 focus:outline-none"
        >
          {member.avatar ? (
            <img
              src={member.avatar}
              alt=""
              className="size-8 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-orange/10 text-orange">
              <AtSign size={14} />
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-semibold text-gray-800">
              {member.fullName}
            </span>
            <span className="block truncate text-[11px] text-gray-400">
              @{member.username}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}

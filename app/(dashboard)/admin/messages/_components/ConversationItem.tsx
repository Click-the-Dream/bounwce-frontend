import { Conversation } from "@/app/_utils/types/admin";

function formatTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 60) return `${mins}m`;
  if (hrs < 24) return `${hrs}h`;
  if (days === 1) return "Yesterday";
  return `${days}d`;
}

export default function ConversationItem({
  convo,
  active,
  onClick,
}: {
  convo: Conversation;
  active: boolean;
  onClick: () => void;
}) {
  const last = convo.messages.at(-1);

  return (
    <button
      onClick={onClick}
      className={`w-full flex gap-3 px-4 py-3 border-b text-left ${
        active ? "bg-stone-50" : "hover:bg-stone-50"
      }`}
    >
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold ${convo.user.avatarColor}`}
      >
        {convo.user.initials}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold truncate">{convo.user.name}</p>
        <p className="text-[11px] text-stone-400 truncate">{last?.content}</p>
      </div>

      <div className="text-[10px] text-stone-400">
        {formatTime(convo.lastMessageAt)}
      </div>
    </button>
  );
}

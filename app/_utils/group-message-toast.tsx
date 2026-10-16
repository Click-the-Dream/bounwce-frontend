"use client";

import { AtSign, Users, X } from "lucide-react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import UserImage from "../(dashboard)/app/_components/UserImage";

function GroupToastContent({
  groupId,
  groupName,
  senderName,
  message,
  profilePic,
  mentioned,
  toastId,
}: {
  groupId: string;
  groupName: string;
  senderName: string;
  message: string;
  profilePic?: { url: string } | string | null;
  mentioned: boolean;
  toastId: string;
}) {
  const router = useRouter();
  const openGroup = () => {
    toast.dismiss(toastId);
    router.push(`/app/chat?groupId=${encodeURIComponent(groupId)}`);
  };

  const normalizedPic =
    typeof profilePic === "string"
      ? { url: profilePic }
      : profilePic && typeof profilePic.url === "string"
        ? { url: profilePic.url }
        : undefined;

  return (
    <div className="group relative flex w-85 max-w-[calc(100vw-24px)] items-center gap-3 overflow-hidden rounded-2xl border border-violet-100 bg-white/95 px-3.5 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.12)] backdrop-blur-xl">
      <button
        type="button"
        onClick={openGroup}
        className="flex min-w-0 flex-1 items-center gap-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-orange/30"
        aria-label={`Open group ${groupName}`}
      >
        <span className="relative shrink-0">
          <UserImage
            user={{ full_name: senderName, profile_pic: normalizedPic }}
            size={40}
            rounded="h-10 w-10 rounded-full object-cover"
          />
          <span className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full border-2 border-white bg-violet-600 text-white">
            <Users size={10} />
          </span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-gray-950">
              {groupName || "Group chat"}
            </span>
            <span className="shrink-0 rounded-full bg-violet-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-violet-700">
              Group
            </span>
          </span>
          <span className="mt-0.5 flex items-center gap-1 text-[12px] leading-5 text-gray-500">
            {mentioned ? (
              <AtSign size={12} className="shrink-0 text-orange" />
            ) : null}
            <span className="truncate">
              {mentioned ? "Mentioned you · " : ""}
              {senderName || "Group member"}: {message || "Sent an attachment"}
            </span>
          </span>
        </span>
      </button>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          toast.dismiss(toastId);
        }}
        className="absolute right-2 top-2 inline-flex size-6 items-center justify-center rounded-full bg-white/90 text-gray-400 shadow-sm transition hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange/30"
        aria-label="Dismiss group notification"
      >
        <X size={13} />
      </button>
    </div>
  );
}

export function onGroupMessageToast({
  groupId,
  groupName,
  messageId,
  senderName,
  message,
  profilePic,
  mentioned = false,
}: {
  groupId: string;
  groupName: string;
  messageId: string;
  senderName: string;
  message: string;
  profilePic?: { url: string } | string | null;
  mentioned?: boolean;
}) {
  if (!groupId || !messageId) return;
  const toastId = `group-message:${groupId}:${messageId}`;
  const content = (
    <GroupToastContent
      groupId={groupId}
      groupName={groupName}
      senderName={senderName}
      message={message}
      profilePic={profilePic}
      mentioned={mentioned}
      toastId={toastId}
    />
  );

  if (toast.isActive(toastId)) {
    toast.update(toastId, { render: content, autoClose: 4500 });
    return;
  }

  toast(content, {
    toastId,
    position: "top-right",
    autoClose: 4500,
    hideProgressBar: true,
    closeButton: false,
    pauseOnHover: true,
    pauseOnFocusLoss: true,
    closeOnClick: false,
    draggable: true,
  });
}

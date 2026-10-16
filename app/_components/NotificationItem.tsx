"use client";

import UserImage from "../(dashboard)/app/_components/UserImage";
import { Users } from "lucide-react";
import { timeAgo } from "../_utils/formatters";
import { Notification } from "../_utils/types/notification";
import { useNotifications } from "../context/NotificationContext";
import useNotificationServices from "../hooks/use-notification";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

interface Props {
  notification: Notification;
  isSelected?: boolean;
  onClose: () => void;
}

export const NotificationItem = ({
  notification,
  isSelected,
  onClose,
}: Props) => {
  const { resetUnread } = useNotifications();
  const { markAsRead } = useNotificationServices();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isChat = notification.event_type === "chat_message";
  const isGroupChat =
    String(notification.event_type ?? "").startsWith("group_") ||
    Boolean(notification.payload?.group_id ?? notification.payload?.groupId);

  const sender = notification.payload?.sender;
  const isUnread = notification.read_at === null;

  const handleItemClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const senderId = sender?.id || notification.payload?.sender_id;
    if (isUnread) {
      markAsRead.mutate(notification.id);
    }

    if (isGroupChat) {
      const groupId = String(notification.payload?.group_id ?? notification.payload?.groupId ?? "");
      if (groupId) {
        queryClient.setQueryData<any[]>(["group-conversations"], (old = []) =>
          old.map((group) => String(group.id) === groupId ? { ...group, unread_count: 0 } : group),
        );
        router.push(`/app/chat?groupId=${encodeURIComponent(groupId)}`);
      } else {
        router.push("/app/chat");
      }
    } else if (isChat && senderId) {
      // Paint the chat header immediately from notification payload while the
      // full /users/:id profile request continues in the background.
      queryClient.setQueryData(["chatUserPreview", senderId], {
        id: senderId,
        full_name: sender?.full_name || notification.title || "Chat",
        username: sender?.username || "",
        profile_pic: sender?.profile_pic,
        email: sender?.email,
      });
      resetUnread(senderId);
      router.push(`/app/chat/${senderId}`);
    } else {
      router.push(isChat ? "/app/chat" : "#");
    }
    onClose();
  };

  return (
    <div
      onClick={handleItemClick}
      className={`cursor-pointer flex items-start gap-3 p-4 border-b border-gray-100 hover:bg-gray-50 my-2 relative ${
        isUnread ? "bg-gray-100/50" : "bg-white"
      }`}
    >
      {isGroupChat ? (
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-violet-50 text-violet-700">
          <Users size={19} />
        </span>
      ) : isChat && sender ? (
        <UserImage
          user={{
            id: sender.id,
            full_name: sender.full_name,
            profile_pic: sender.profile_pic,
          }}
          size={40}
        />
      ) : null}

      <div className="min-w-0 flex-1">
        {isChat || isGroupChat ? (
          <>
            <p className="flex items-center gap-1.5 text-sm font-medium text-black">
              <span className="min-w-0 truncate">{notification.title}</span>
              {isGroupChat ? <span className="shrink-0 rounded-full bg-violet-50 px-1.5 py-0.5 text-[9px] font-bold uppercase text-violet-700">Group</span> : null}
            </p>
            <p className="text-xs text-gray-600 line-clamp-2">
              {isGroupChat
                ? notification.body
                : `@${sender?.username || sender?.full_name || "User"} sent a message`}
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-black">
              {notification.title}
            </p>

            <p className="text-xs text-gray-600 line-clamp-2">
              {notification.body}
            </p>
          </>
        )}

        <span className="text-[10px] text-gray-400 mt-1 block">
          {timeAgo(notification.created_at)}
        </span>
      </div>
      {isUnread && (
        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1 shrink-0" />
      )}
    </div>
  );
};

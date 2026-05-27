import Link from "next/link";
import UserImage from "../(dashboard)/app/_components/UserImage";
import { timeAgo } from "../_utils/formatters";
import { Notification } from "../_utils/types/notification";
import useNotificationServices from "../hooks/use-notification";
import { useRouter } from "next/navigation";

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
  const { markAsRead } = useNotificationServices();
  const router = useRouter();
  const isChat = notification.event_type === "chat_message";

  const sender = notification.payload?.sender;
  const conversationId = notification.payload?.conversation_id;
  const isUnread = notification.read_at === null;
  console.log(notification);

  const handleItemClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const target = isChat ? `/app/chat/${conversationId}` : "#";
    if (isUnread) {
      markAsRead.mutate(notification.id);
    }
    router.push(target);
    onClose();
  };

  return (
    <Link
      href={isChat ? `/app/chat/${conversationId}` : "#"}
      onClick={handleItemClick}
      className={`flex items-start gap-3 p-4 border-b border-gray-100 hover:bg-gray-50 my-2 relative ${
        isUnread ? "bg-gray-100/50" : "bg-white"
      }`}
    >
      {isChat && sender && (
        <UserImage
          user={{
            id: sender.id,
            full_name: sender.full_name,
            profile_pic: sender.profile_pic,
          }}
          size={40}
        />
      )}

      <div className="flex-1">
        {isChat ? (
          <>
            <p className="text-sm font-medium text-black line-clamp-1">
              {notification.title}
            </p>

            <p className="text-xs text-gray-700">
              <span>@{sender?.username}</span> sent a message
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
    </Link>
  );
};

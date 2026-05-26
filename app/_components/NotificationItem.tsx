import Link from "next/link";
import UserImage from "../(dashboard)/app/_components/UserImage";
import { timeAgo } from "../_utils/formatters";
import { Notification } from "../_utils/types/notification";

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
  const isChat = notification.event_type === "chat_message";

  // Dynamic content based on notification type
  const renderContent = () => {
    if (isChat) {
      return (
        <>
          <p className="text-sm font-medium text-black line-clamp-1">
            {notification.title}
          </p>
          <p className="text-xs text-gray-700">
            <span>@{notification.payload?.sender?.username}</span> sent a
            message
          </p>
        </>
      );
    }
    // System notification layout
    return (
      <>
        <p className="text-sm font-medium text-black">{notification.title}</p>
        <p className="text-xs text-gray-600 line-clamp-2">
          {notification.body}
        </p>
      </>
    );
  };

  return (
    <Link
      href={isChat ? `/app/chat/${notification.payload?.sender?.id}` : "#"}
      onClick={onClose}
      className={`flex items-start gap-3 p-4 border-b border-gray-100 hover:bg-gray-50 ${isSelected ? "bg-gray-50" : "bg-white"}`}
    >
      {isChat && (
        <UserImage
          user={{
            id: notification.payload?.sender?.id,
            full_name: notification.title,
            profile_pic: notification.payload?.sender?.profile_pic,
          }}
          size={40}
        />
      )}
      <div className="flex-1">
        {renderContent()}
        <span className="text-[10px] text-gray-400 mt-1 block">
          {timeAgo(notification.created_at)}
        </span>
      </div>
    </Link>
  );
};

import SafeImage from "@/app/_components/SafeImage";
import UserImage from "../(dashboard)/app/_components/UserImage";
import { timeAgo } from "../_utils/formatters";
import Link from "next/link";

interface Props {
  notification: any; // Use your Notification type here
  isSelected?: boolean;
  onClose: () => void;
}

export const NotificationItem = ({
  notification,
  isSelected,
  onClose,
}: Props) => {
  return (
    <Link
      href={`/app/chat/${notification.sender_id}`}
      onClick={onClose}
      className={`flex items-start gap-3 p-4 border-b border-gray-100 hover:bg-gray-300 ${isSelected ? "bg-gray-50" : "bg-white"}`}
    >
      <div className="relative">
        <UserImage
          user={{
            id: notification?.sender_id,
            full_name: notification.sender_name,
            profile_pic: notification.profile_pic,
          }}
          size={40}
        />
      </div>

      <div className="flex-1">
        <p className="text-sm font-medium text-black line-clamp-1">
          {notification.sender_name}
        </p>

        <p className="text-xs text-gray-700">
          <span className="">@{notification.username}</span>{" "}
          <span className="text-gray-600">sent a new message</span>
        </p>
        <span className="text-[10px] text-gray-400 mt-1 block">
          {timeAgo(notification.created_at)}
        </span>
      </div>
    </Link>
  );
};

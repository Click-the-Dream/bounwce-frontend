import { useNotifications } from "@/app/context/NotificationContext";
import { NotificationItem } from "./NotificationItem";

export const NotificationPanel = ({ onClose }: { onClose: () => void }) => {
  const { notifications } = useNotifications();

  return (
    <div className="w-80 md:w-96 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden">
      <div className="px-4 py-2 border-b border-gray-100">
        <h2 className="text-sm font-bold">Notification</h2>
      </div>

      <div className="max-h-[50vh] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="text-sm p-8 text-center text-gray-500">
            No notifications yet
          </div>
        ) : (
          notifications.map((n, index) => (
            // The middle item in your design is highlighted (index 1)
            <NotificationItem
              key={n.id}
              notification={n}
              isSelected={index === 1}
              onClose={onClose}
            />
          ))
        )}
      </div>
    </div>
  );
};

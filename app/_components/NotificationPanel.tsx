import { useEffect, useRef } from "react";
import { useNotifications } from "@/app/context/NotificationContext";
import { NotificationItem } from "./NotificationItem";

export const NotificationPanel = ({ onClose }: { onClose: () => void }) => {
  const { notifications, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useNotifications();
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;

    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 50;

    if (nearBottom && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [hasNextPage, isFetchingNextPage]);

  return (
    <div className="w-80 md:w-96 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden">
      {/* HEADER */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
        <h2 className="text-sm font-bold text-gray-900">Notifications</h2>
      </div>

      {/* LIST */}
      <div ref={scrollRef} className="max-h-[50vh] overflow-y-auto">
        {/* EMPTY STATE */}
        {notifications.length === 0 && (
          <div className="text-sm p-8 text-center text-gray-500">
            No notifications yet
          </div>
        )}

        {/* LIST ITEMS */}
        {notifications.map((n) => (
          <NotificationItem
            key={n.id}
            notification={n}
            isSelected={!n.read_at}
            onClose={onClose}
          />
        ))}

        {/* LOADING MORE */}
        {isFetchingNextPage && (
          <div className="p-3 text-xs text-center text-gray-400">
            Loading more...
          </div>
        )}

        {/* END INDICATOR */}
        {!hasNextPage && notifications.length > 10 && (
          <div className="p-3 text-xs text-center text-gray-400">
            No more notifications
          </div>
        )}
      </div>
    </div>
  );
};

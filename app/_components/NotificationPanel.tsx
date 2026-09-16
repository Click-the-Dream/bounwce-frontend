import { useEffect, useRef } from "react";
import { CheckCheck, X } from "lucide-react";

import { useNotifications } from "@/app/context/NotificationContext";
import { NotificationItem } from "./NotificationItem";
import useNotificationServices from "../hooks/use-notification";

export const NotificationPanel = ({ onClose }: { onClose: () => void }) => {
  const { notifications, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useNotifications();

  const { markAllAsRead } = useNotificationServices();

  const scrollRef = useRef<HTMLDivElement>(null);

  const hasUnread = notifications.some(
    (notification) => notification.read_at === null,
  );

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

    return () => {
      el.removeEventListener("scroll", handleScroll);
    };
  }, [hasNextPage, isFetchingNextPage]);

  return (
    <div className="w-80 md:w-96 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-2xl">
      {/* HEADER */}
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 bg-gray-50 px-4 py-3">
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-gray-900">Notifications</h2>
          {hasUnread && (
            <p className="mt-0.5 text-[11px] text-gray-500">
              You have unread notifications
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {hasUnread && (
            <button
              type="button"
              onClick={() => markAllAsRead.mutate()}
              disabled={markAllAsRead.isPending}
              aria-label="Mark all notifications as read"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-semibold text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCheck className="size-3.5" />

              <span>
                {markAllAsRead.isPending ? "Marking..." : "Mark all read"}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            aria-label="Close notifications"
            className="inline-flex size-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700"
          >
            <X className="size-5 text-red-500" />
          </button>
        </div>
      </div>

      {/* LIST */}
      <div ref={scrollRef} className="max-h-[50vh] overflow-y-auto">
        {/* EMPTY STATE */}
        {notifications.length === 0 && (
          <div className="px-8 py-10 text-center">
            <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-gray-100">
              <CheckCheck className="size-5 text-gray-400" />
            </div>

            <p className="text-sm font-medium text-gray-700">
              No notifications yet
            </p>

            <p className="mt-1 text-xs text-gray-400">
              You&apos;re all caught up.
            </p>
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
          <div className="p-3 text-center text-xs text-gray-400">
            Loading more...
          </div>
        )}

        {/* END INDICATOR */}
        {!hasNextPage && notifications.length > 10 && (
          <div className="p-3 text-center text-xs text-gray-400">
            No more notifications
          </div>
        )}
      </div>
    </div>
  );
};

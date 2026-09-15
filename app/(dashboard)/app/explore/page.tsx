"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import useMatch from "@/app/hooks/use-match";
import ExploreCard from "./_components/ExploreCard";
import { ConnectStatus, SuggestedCandidate } from "@/app/_utils/types/payload";
import ExploreCardSkeleton from "../_components/loader/ExploreCardSkeleton";
import { onFailure } from "@/app/_utils/notification";
import { useQueryClient } from "@tanstack/react-query";
import { useNotifications } from "@/app/context/NotificationContext";

const ExplorePage = () => {
  const queryClient = useQueryClient();
  const { useGetSuggestedCandidates, createMatchRequest, useGetMatchRequests } =
    useMatch();
  const { setConnectionModal } = useNotifications();
  const { data: requestData } = useGetMatchRequests();
  const [connectState, setConnectState] = useState<
    Record<string, ConnectStatus>
  >({});

  const {
    data: suggestData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useGetSuggestedCandidates();

  const suggestions = useMemo(() => {
    return suggestData?.pages.flatMap((page) => page.items) ?? [];
  }, [suggestData]);

  const requestMap = useMemo(() => {
    const map: Record<string, any> = {};

    if (!requestData?.items) return map;

    for (const req of requestData.items) {
      map[req.target_user_id] = req;
    }

    return map;
  }, [requestData]);

  const getStatus = (userId: string): ConnectStatus => {
    const req = requestMap[userId];

    if (!req) return "idle";

    switch (req.status) {
      case "pending":
        return "pending";

      case "accepted":
        return "connected";

      default:
        return "idle";
    }
  };

  const sentinelRef = useRef<HTMLDivElement>(null);
  const isPrefetchingRef = useRef(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;

    if (!sentinel) return;
    const findScrollParent = (
      element: HTMLElement | null,
    ): HTMLElement | Window => {
      let parent = element?.parentElement;

      while (parent) {
        const styles = window.getComputedStyle(parent);
        const overflowY = styles.overflowY;

        const canScroll =
          (overflowY === "auto" || overflowY === "scroll") &&
          parent.scrollHeight > parent.clientHeight;

        if (canScroll) {
          return parent;
        }

        parent = parent.parentElement;
      }

      return window;
    };

    const scrollParent = findScrollParent(sentinel);

    const maybeFetchNextPage = () => {
      if (!hasNextPage) return;
      if (isFetchingNextPage) return;
      if (isPrefetchingRef.current) return;

      let distanceFromBottom = Infinity;

      if (scrollParent === window) {
        const documentHeight = Math.max(
          document.body.scrollHeight,
          document.documentElement.scrollHeight,
        );

        const viewportBottom = window.scrollY + window.innerHeight;

        distanceFromBottom = documentHeight - viewportBottom;
      } else {
        const container = scrollParent as HTMLElement;

        distanceFromBottom =
          container.scrollHeight - container.scrollTop - container.clientHeight;
      }

      if (distanceFromBottom <= 1800) {
        isPrefetchingRef.current = true;

        fetchNextPage().finally(() => {
          isPrefetchingRef.current = false;
        });
      }
    };

    const target =
      scrollParent === window ? window : (scrollParent as HTMLElement);

    target.addEventListener("scroll", maybeFetchNextPage, { passive: true });

    maybeFetchNextPage();
    const initialCheck = window.setTimeout(() => {
      maybeFetchNextPage();
    }, 100);

    return () => {
      target.removeEventListener("scroll", maybeFetchNextPage);

      window.clearTimeout(initialCheck);
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleConnect = (userId: string, user: SuggestedCandidate) => {
    setConnectState((prev) => ({
      ...prev,
      [userId]: "loading",
    }));

    createMatchRequest.mutate(
      {
        target_user_id: userId,
      },
      {
        onSuccess: () => {
          setConnectState((prev) => ({
            ...prev,
            [userId]: "pending",
          }));

          queryClient.invalidateQueries();

          setConnectionModal({
            isOpen: true,
            userId,
            full_name: user.full_name ?? "User",
            profile_pic: {
              url: user.profile_pic,
            },
          });
        },

        onError: () => {
          setConnectState((prev) => ({
            ...prev,
            [userId]: "idle",
          }));

          onFailure({
            title: "Connection Request Failed",
            message: "Failed to send connection request. Please try again.",
          });
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-800 py-5.75">
        <main className="flex justify-center px-4 md:px-8 xl:px-14">
          <div className="w-full max-w-7xl">
            <div className="grid grid-cols-store gap-x-2.5 gap-y-8.75 pb-12 justify-center">
              {Array.from({ length: 8 }).map((_, i) => (
                <ExploreCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-gray-600 gap-3">
        <p>Failed to load suggestions.</p>

        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-black text-white rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!suggestions || suggestions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
            <svg
              className="h-6 w-6 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.172 16.172a4 4 0 015.656 0M12 14h.01M7.5 8.5h.01M16.5 8.5h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h2 className="text-[16px] font-semibold text-gray-900">
            No suggestions yet
          </h2>

          <p className="mt-2 text-sm text-gray-500 leading-relaxed">
            We couldn’t find any recommendations right now. Try again later or
            update your preferences.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 text-gray-800 py-5.75">
        <main className="flex justify-center px-4 md:px-8 xl:px-14">
          <div className="w-full max-w-7xl">
            <div className="grid grid-cols-store gap-x-2.5 gap-y-8.75 pb-12 justify-center">
              {suggestions.map((user: SuggestedCandidate) => {
                const status =
                  connectState[user.user_id] || getStatus(user.user_id);

                return (
                  <ExploreCard
                    key={user.user_id}
                    {...user}
                    connectStatus={status}
                    onConnect={(id) => handleConnect(id, user)}
                  />
                );
              })}

              {isFetchingNextPage && hasNextPage && (
                <>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <ExploreCardSkeleton key={`skeleton-${i}`} />
                  ))}
                </>
              )}
            </div>

            {/* 
              Invisible prefetch trigger.

              Because the observer has a 1200px bottom rootMargin,
              this element does NOT need to physically enter the
              viewport before pagination begins.
            */}
            <div ref={sentinelRef} className="h-px w-full" aria-hidden="true" />
          </div>
        </main>
      </div>
    </>
  );
};

export default ExplorePage;

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { websocket } from "@/app/services/websocket";
import {
  GroupMessageRecord,
  GroupMessagesPage,
  GroupRecord,
  groupChatApi,
} from "@/app/services/group-chat";

export interface GroupChatMessage extends GroupMessageRecord {
  client_id?: string;
  pending?: boolean;
  delivery_status?: "sending" | "sent" | "failed";
  render_id?: string;
}

export interface GroupChatUser {
  id: string;
  username?: string | null;
  full_name?: string | null;
  profile_pic?: { url?: string } | string | null;
  [key: string]: unknown;
}

interface GroupTypingUser {
  user_id: string;
  username: string | null;
}

type GroupFrame = Record<string, any> & {
  type: string;
  data?: any;
  payload?: any;
  client_id?: string;
  sender?: GroupChatUser;
  group_id?: string;
};

const messagesKey = (groupId: string) => ["group-messages", groupId] as const;
const historyKey = (groupId: string) =>
  ["group-message-pages", groupId] as const;
const GROUP_MESSAGE_PAGE_SIZE = 20;
const getNextGroupMessagePageParam = (lastPage: GroupMessagesPage) => {
  if (lastPage.next_page != null) return Number(lastPage.next_page);
  if (lastPage.has_more !== undefined) {
    return lastPage.has_more ? Number(lastPage.page) + 1 : undefined;
  }
  if (lastPage.total_pages != null) {
    return lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined;
  }
  return lastPage.page * lastPage.page_size < lastPage.total
    ? lastPage.page + 1
    : undefined;
};
const getFrameData = (frame: GroupFrame) =>
  frame?.data ?? frame?.payload ?? frame;
const getFrameMessage = (frame: GroupFrame): GroupChatMessage => {
  const raw = getFrameData(frame);
  return (raw?.message ?? raw) as GroupChatMessage;
};
const sortMessages = (messages: GroupChatMessage[]) =>
  [...messages].sort((a, b) => {
    const left = new Date(a.created_at ?? 0).getTime();
    const right = new Date(b.created_at ?? 0).getTime();
    return left - right;
  });

function mergeMessage(current: GroupChatMessage[], incoming: GroupChatMessage) {
  const identity = (message: GroupChatMessage) =>
    [message?.id, message?.client_id, message?.render_id]
      .filter((value) => value !== null && value !== undefined && value !== "")
      .map(String);
  const incomingIds = new Set(identity(incoming));
  if (!incomingIds.size) return current;
  const matches = current
    .map((message, index) => ({ message, index }))
    .filter(({ message }) =>
      identity(message).some((id) => incomingIds.has(id)),
    );

  // A server ack and the group broadcast can race. Merge into the optimistic
  // bubble first and remove any other copies with the same known identity.
  if (matches.length) {
    const preferred =
      matches.find(({ message }) => message.pending) ?? matches[0];
    const merged = {
      ...preferred.message,
      ...incoming,
      render_id:
        preferred.message.render_id ??
        preferred.message.client_id ??
        preferred.message.id,
      pending: false,
      delivery_status: "sent" as const,
    };
    const remove = new Set(matches.map(({ index }) => index));
    const next = current.filter((_message, index) => !remove.has(index));
    next.push(merged);
    return sortMessages(next);
  }
  return sortMessages([
    ...current,
    {
      ...incoming,
      render_id: incoming.render_id ?? incoming.client_id ?? incoming.id,
      pending: incoming.pending ?? false,
      delivery_status: incoming.delivery_status ?? "sent",
    },
  ]);
}

function combineDisplayMessages(
  history: GroupChatMessage[],
  live: GroupChatMessage[],
): GroupChatMessage[] {
  const result = [...history];
  const identities = (message: GroupChatMessage) =>
    [message.id, message.client_id, message.render_id]
      .filter((value) => value !== undefined && value !== null && value !== "")
      .map(String);

  for (const incoming of live) {
    const keys = new Set(identities(incoming));
    const index = result.findIndex((message) =>
      identities(message).some((key) => keys.has(key)),
    );
    if (index === -1) {
      result.push(incoming);
      continue;
    }
    const existing = result[index];
    result[index] = {
      ...existing,
      ...incoming,
      render_id:
        existing.render_id ??
        incoming.render_id ??
        incoming.client_id ??
        incoming.id,
    };
  }

  const byId = new Map<string, GroupChatMessage>();
  for (const message of result) {
    const identity = String(
      message.render_id ?? message.client_id ?? message.id,
    );
    const existing = byId.get(identity);
    byId.set(
      identity,
      existing ? { ...existing, ...message, render_id: identity } : message,
    );
  }
  return sortMessages([...byId.values()]);
}

function updateHistoryPageCache(
  queryClient: ReturnType<typeof useQueryClient>,
  groupId: string,
  update: (items: GroupChatMessage[]) => GroupChatMessage[],
) {
  queryClient.setQueryData<any>(historyKey(groupId), (old: any) => {
    if (!old?.pages?.length) return old;
    return {
      ...old,
      pages: old.pages.map((page: GroupMessagesPage) => ({
        ...page,
        items: update((page.items ?? []) as GroupChatMessage[]),
      })),
    };
  });
}

function upsertGroupPreview(
  current: GroupRecord[] | undefined,
  message: GroupChatMessage,
  currentUserId?: string,
  activeGroupId?: string,
) {
  if (!current) return current;
  return current
    .map((group) => {
      if (String(group.id) !== String(message.group_id)) return group;
      const isMine =
        currentUserId && String(message.sender_id) === String(currentUserId);
      const isActive =
        activeGroupId && String(activeGroupId) === String(group.id);
      const unread =
        isMine || isActive
          ? isActive
            ? 0
            : (group.unread_count ?? 0)
          : (group.unread_count ?? 0) + 1;
      return {
        ...group,
        last_message: {
          id: message.id,
          body: message.body,
          sender_id: message.sender_id,
          created_at: message.created_at,
          media_type: message.media_type,
        },
        updated_at: message.created_at || group.updated_at,
        unread_count: unread,
      };
    })
    .sort(
      (a, b) =>
        new Date(b.last_message?.created_at ?? b.updated_at ?? 0).getTime() -
        new Date(a.last_message?.created_at ?? a.updated_at ?? 0).getTime(),
    );
}

/**
 * Group-specific behaviors on the shared /api/v1/events/ws socket. This hook
 * never creates a second WebSocket and can stay mounted while /chat is idle so
 * group-list previews/unread counters update for messages in other groups.
 */
export function useGroupSocket(
  groupId?: string,
  enabled = true,
  currentUserId?: string,
) {
  const queryClient = useQueryClient();
  const [typingUsers, setTypingUsers] = useState<GroupTypingUser[]>([]);
  const [actionError, setActionError] = useState("");
  const [connectionState, setConnectionState] = useState(websocket.getState());
  const typingTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {},
  );
  const clientIds = useRef(new Map<string, string>());
  const activeGroupRef = useRef<string | undefined>(groupId);
  const userIdRef = useRef<string | undefined>(currentUserId);
  const previousConnectionState = useRef(connectionState);

  useEffect(() => {
    activeGroupRef.current = groupId;
    userIdRef.current = currentUserId;
    if (groupId) {
      queryClient.setQueryData<GroupRecord[]>(["group-conversations"], (old) =>
        old?.map((group) =>
          String(group.id) === String(groupId)
            ? { ...group, unread_count: 0 }
            : group,
        ),
      );
    }
  }, [groupId, currentUserId, queryClient]);

  const active = Boolean(enabled && groupId);
  const activeGroupId = groupId || "__none__";
  const historyQueryKey = useMemo(
    () => historyKey(activeGroupId),
    [activeGroupId],
  );
  const liveQuery = useQuery<GroupChatMessage[]>({
    queryKey: messagesKey(activeGroupId),
    queryFn: async () => [],
    enabled: false,
    initialData: [],
    staleTime: Infinity,
  });

  const historyQuery = useInfiniteQuery({
    queryKey: historyQueryKey,
    queryFn: async ({ pageParam = 1 }) =>
      groupChatApi.listMessages(
        groupId as string,
        Number(pageParam),
        GROUP_MESSAGE_PAGE_SIZE,
      ),
    getNextPageParam: (lastPage) => getNextGroupMessagePageParam(lastPage),
    initialPageParam: 1,
    enabled: active,
    staleTime: 15_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: false,
  });

  const messages = useMemo(() => {
    const history = (historyQuery.data?.pages ?? []).flatMap(
      (page: GroupMessagesPage) => (page.items ?? []) as GroupChatMessage[],
    );
    return combineDisplayMessages(history, liveQuery.data ?? []);
  }, [historyQuery.data, liveQuery.data]);

  useEffect(() => {
    // Active-panel typing is reset when switching groups, but the shared
    // timers stay alive so sidebar typing previews for other groups can expire.
    setTypingUsers([]);
    setActionError("");
  }, [groupId]);

  useEffect(() => {
    const listener = (state: ReturnType<typeof websocket.getState>) => {
      const previous = previousConnectionState.current;
      previousConnectionState.current = state;
      setConnectionState(state);
      if (
        state === "connected" &&
        previous !== "connected" &&
        activeGroupRef.current
      ) {
        void queryClient.invalidateQueries({
          queryKey: historyKey(activeGroupRef.current),
          exact: true,
        });
      }
    };
    websocket.onStateChange(listener);
    return () => websocket.offStateChange(listener);
  }, [queryClient]);

  useEffect(() => {
    if (!enabled) return;

    const applyMessage = (frame: GroupFrame) => {
      const incoming = getFrameMessage(frame);
      const frameGroupId = incoming?.group_id ?? frame.group_id;
      if (!incoming || !frameGroupId) return;
      const clientId = frame.client_id ?? incoming.client_id;
      const normalized: GroupChatMessage = {
        ...incoming,
        group_id: String(frameGroupId),
        sender: incoming.sender ?? frame.sender,
        client_id: clientId,
        render_id: incoming.render_id ?? clientId ?? incoming.id,
        pending: false,
        delivery_status: "sent",
      };
      queryClient.setQueryData<GroupChatMessage[]>(
        messagesKey(String(frameGroupId)),
        (old = []) => mergeMessage(old, normalized),
      );
      // If this group is not currently open, it may only have socket-arrival
      // cache rows (not history). Mark it stale so selecting it always fetches
      // the full REST history instead of showing only the new live messages.
      if (String(frameGroupId) !== String(activeGroupRef.current ?? "")) {
        void queryClient.invalidateQueries({
          queryKey: historyKey(String(frameGroupId)),
          exact: true,
          refetchType: "none",
        });
      }
      if (clientId) clientIds.current.delete(String(clientId));
      queryClient.setQueryData<GroupRecord[]>(["group-conversations"], (old) =>
        upsertGroupPreview(
          old,
          normalized,
          userIdRef.current,
          activeGroupRef.current,
        ),
      );
    };

    const onGroupMessage = (frame: GroupFrame) => applyMessage(frame);
    const onGroupMessageSent = (frame: GroupFrame) => applyMessage(frame);

    const onGroupUpdated = (frame: GroupFrame) => {
      const raw = getFrameData(frame);
      const message = (raw?.message ?? raw) as GroupChatMessage;
      const id = message?.group_id ?? frame.group_id;
      if (!message?.id || !id) return;
      const updateMatchingMessage = (items: GroupChatMessage[]) =>
        sortMessages(
          items.map((item) =>
            String(item.id) === String(message.id)
              ? {
                  ...item,
                  ...message,
                  sender: message.sender ?? frame.sender,
                  pending: false,
                }
              : item,
          ),
        );
      queryClient.setQueryData<GroupChatMessage[]>(
        messagesKey(String(id)),
        (old = []) => updateMatchingMessage(old),
      );
      updateHistoryPageCache(queryClient, String(id), updateMatchingMessage);
      void queryClient.invalidateQueries({ queryKey: ["group-conversations"] });
    };

    const onGroupDeleted = (frame: GroupFrame) => {
      const data = getFrameData(frame);
      const id = data?.group_id ?? frame.group_id;
      const messageId = data?.message_id;
      if (!id || !messageId) return;
      const removeMessage = (items: GroupChatMessage[]) =>
        items.filter((item) => String(item.id) !== String(messageId));
      queryClient.setQueryData<GroupChatMessage[]>(
        messagesKey(String(id)),
        (old = []) => removeMessage(old),
      );
      updateHistoryPageCache(queryClient, String(id), removeMessage);
      void queryClient.invalidateQueries({ queryKey: ["group-conversations"] });
    };

    const onTyping = (frame: GroupFrame) => {
      const data = getFrameData(frame);
      const eventGroupId = String(data?.group_id ?? frame.group_id ?? "");
      if (!eventGroupId || !data?.user_id) return;
      const userId = String(data.user_id);
      if (userId === String(userIdRef.current ?? "")) return;
      const timerKey = `${eventGroupId}:${userId}`;
      const username = typeof data.username === "string" ? data.username.trim() || null : null;
      const updateGlobalTyping = (isTyping: boolean) => {
        queryClient.setQueryData<Record<string, GroupTypingUser[]>>(
          ["group-typing-status"],
          (old = {}) => {
            const current = old[eventGroupId] ?? [];
            const nextUsers = isTyping
              ? current.some((user) => user.user_id === userId)
                ? current.map((user) => user.user_id === userId ? { user_id: userId, username } : user)
                : [...current, { user_id: userId, username }]
              : current.filter((user) => user.user_id !== userId);
            const next = { ...old };
            if (nextUsers.length) next[eventGroupId] = nextUsers;
            else delete next[eventGroupId];
            return next;
          },
        );
      };
      const isActiveGroup = String(activeGroupRef.current ?? "") === eventGroupId;
      const updateActiveTyping = (isTyping: boolean) => {
        if (!isActiveGroup) return;
        setTypingUsers((old) => isTyping
          ? old.some((user) => user.user_id === userId)
            ? old.map((user) => user.user_id === userId ? { user_id: userId, username } : user)
            : [...old, { user_id: userId, username }]
          : old.filter((user) => user.user_id !== userId));
      };
      if (data.is_typing) {
        updateGlobalTyping(true);
        updateActiveTyping(true);
        if (typingTimers.current[timerKey]) clearTimeout(typingTimers.current[timerKey]);
        typingTimers.current[timerKey] = setTimeout(() => {
          updateGlobalTyping(false);
          updateActiveTyping(false);
          delete typingTimers.current[timerKey];
        }, 3_500);
      } else {
        if (typingTimers.current[timerKey]) clearTimeout(typingTimers.current[timerKey]);
        delete typingTimers.current[timerKey];
        updateGlobalTyping(false);
        updateActiveTyping(false);
      }
    };

    const onError = (frame: GroupFrame) => {
      const data = getFrameData(frame);
      const errorName = String(data?.error ?? frame.error ?? "").toLowerCase();
      const messageText = String(data?.message ?? frame.message ?? "");
      const lowerMessageText = messageText.toLowerCase();
      const isGroupError = Boolean(
        data?.client_id ||
        frame.client_id ||
        errorName.startsWith("group") ||
        errorName === "invalid_group_id" ||
        errorName === "group.access.denied" ||
        lowerMessageText.includes("group") ||
        lowerMessageText.includes("message body cannot be empty"),
      );
      if (!isGroupError) return;
      const isEditOrDeleteError =
        /group[._]message[._](edit|delete)([._]failed)?/.test(errorName);
      if (isEditOrDeleteError) {
        setActionError(
          messageText || "The group message could not be changed.",
        );
        const activeId = activeGroupRef.current;
        if (activeId)
          void queryClient.invalidateQueries({
            queryKey: historyKey(activeId),
            exact: true,
          });
        void queryClient.invalidateQueries({
          queryKey: ["group-conversations"],
        });
        return;
      }
      setActionError(messageText || "The group message could not be sent.");
      const id = data?.client_id ?? frame.client_id;
      const localMessageId = id ? clientIds.current.get(String(id)) : undefined;
      const activeId = activeGroupRef.current;
      if (!activeId) return;
      queryClient.setQueryData<GroupChatMessage[]>(
        messagesKey(activeId),
        (old = []) => {
          let marked = false;
          return old.map((item) => {
            const isTarget = localMessageId
              ? item.id === localMessageId
              : !marked && (item.pending || item.delivery_status === "sending");
            if (!isTarget) return item;
            marked = true;
            return { ...item, pending: false, delivery_status: "failed" };
          });
        },
      );
      if (id) clientIds.current.delete(String(id));
    };

    const refreshOnReady = () => {
      const selectedGroupId = activeGroupRef.current;
      if (selectedGroupId)
        void queryClient.invalidateQueries({
          queryKey: historyKey(selectedGroupId),
          exact: true,
        });
      void queryClient.invalidateQueries({ queryKey: ["group-conversations"] });
    };

    // The backend contract emits underscore event names. Register the dotted
    // aliases too so older staging builds remain compatible.
    websocket.on("group_message", onGroupMessage);
    websocket.on("group.message", onGroupMessage);
    websocket.on("group_message_sent", onGroupMessageSent);
    websocket.on("group.message.sent", onGroupMessageSent);
    websocket.on("group_message_updated", onGroupUpdated);
    websocket.on("group.message.updated", onGroupUpdated);
    websocket.on("group_message_deleted", onGroupDeleted);
    websocket.on("group.message.deleted", onGroupDeleted);
    websocket.on("group_typing", onTyping);
    websocket.on("group.typing", onTyping);
    websocket.on("error", onError);
    websocket.on("chat.ready", refreshOnReady);

    return () => {
      websocket.off("group_message", onGroupMessage);
      websocket.off("group.message", onGroupMessage);
      websocket.off("group_message_sent", onGroupMessageSent);
      websocket.off("group.message.sent", onGroupMessageSent);
      websocket.off("group_message_updated", onGroupUpdated);
      websocket.off("group.message.updated", onGroupUpdated);
      websocket.off("group_message_deleted", onGroupDeleted);
      websocket.off("group.message.deleted", onGroupDeleted);
      websocket.off("group_typing", onTyping);
      websocket.off("group.typing", onTyping);
      websocket.off("error", onError);
      websocket.off("chat.ready", refreshOnReady);
      Object.entries(typingTimers.current).forEach(([timerKey, timer]) => {
        clearTimeout(timer);
        const separator = timerKey.lastIndexOf(":");
        if (separator < 0) return;
        const eventGroupId = timerKey.slice(0, separator);
        const userId = timerKey.slice(separator + 1);
        queryClient.setQueryData<Record<string, GroupTypingUser[]>>(
          ["group-typing-status"],
          (old = {}) => {
            const next = { ...old };
            const remaining = (next[eventGroupId] ?? []).filter((user) => user.user_id !== userId);
            if (remaining.length) next[eventGroupId] = remaining;
            else delete next[eventGroupId];
            return next;
          },
        );
      });
      typingTimers.current = {};
      setTypingUsers([]);
    };
  }, [enabled, queryClient]);

  const sendMessage = useCallback(
    (
      body: string,
      options: {
        media_type?: GroupMessageRecord["media_type"];
        media_urls?: string[] | null;
        media_names?: string[] | null;
        reply_to_message_id?: string | null;
        mentioned_user_ids?: string[] | null;
      } = {},
    ) => {
      setActionError("");
      if (!groupId) throw new Error("Select a group before sending a message.");
      if (!body.trim() && !options.media_urls?.length)
        throw new Error("Message cannot be empty.");
      const clientId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `group-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const optimisticId = `optimistic:${clientId}`;
      const optimistic: GroupChatMessage = {
        id: optimisticId,
        client_id: clientId,
        render_id: optimisticId,
        group_id: groupId,
        sender_id: currentUserId ?? "",
        body: body.trim() || null,
        created_at: new Date().toISOString(),
        ...options,
        pending: true,
        delivery_status: "sending",
      };
      clientIds.current.set(clientId, optimisticId);
      queryClient.setQueryData<GroupChatMessage[]>(
        messagesKey(groupId),
        (old = []) => mergeMessage(old, optimistic),
      );
      const sent = websocket.emit(
        "group_message",
        {
          group_id: groupId,
          body: body.trim(),
          client_id: clientId,
          ...options,
          // Keep the reply relationship explicit in the group frame. The backend
          // contract uses this exact field for group replies.
          reply_to_message_id: options.reply_to_message_id
            ? String(options.reply_to_message_id)
            : null,
        },
        { queueIfDisconnected: false },
      );
      if (!sent) {
        clientIds.current.delete(clientId);
        queryClient.setQueryData<GroupChatMessage[]>(
          messagesKey(groupId),
          (old = []) =>
            old.map((item) =>
              item.id === optimisticId
                ? { ...item, pending: false, delivery_status: "failed" }
                : item,
            ),
        );
      }
      return clientId;
    },
    [groupId, currentUserId, queryClient],
  );

  const setTyping = useCallback(
    (isTyping: boolean) => {
      if (!groupId || !enabled) return false;
      return websocket.emit(
        "group_typing",
        { group_id: groupId, is_typing: isTyping },
        { queueIfDisconnected: false },
      );
    },
    [groupId, enabled],
  );

  const editMessage = useCallback(
    (messageId: string, body: string) => {
      setActionError("");
      if (!groupId || !body.trim()) return false;
      const sent = websocket.emit(
        "group_message_edit",
        { group_id: groupId, message_id: messageId, body: body.trim() },
        { queueIfDisconnected: false },
      );
      if (!sent)
        setActionError(
          "You are offline. Reconnect before editing this message.",
        );
      return sent;
    },
    [groupId],
  );

  const deleteMessage = useCallback(
    (messageId: string) => {
      setActionError("");
      if (!groupId) return false;
      const sent = websocket.emit(
        "group_message_delete",
        { group_id: groupId, message_id: messageId },
        { queueIfDisconnected: false },
      );
      if (!sent)
        setActionError(
          "You are offline. Reconnect before deleting this message.",
        );
      return sent;
    },
    [groupId],
  );

  return {
    messages,
    isLoading: historyQuery.isLoading,
    isFetching: historyQuery.isFetching,
    isError: historyQuery.isError,
    error: historyQuery.error,
    refetch: historyQuery.refetch,
    fetchNextPage: historyQuery.fetchNextPage,
    hasNextPage: Boolean(historyQuery.hasNextPage),
    isFetchingNextPage: historyQuery.isFetchingNextPage,
    typingUsers,
    actionError,
    connectionState,
    isConnected: connectionState === "connected",
    sendMessage,
    setTyping,
    editMessage,
    deleteMessage,
  };
}

/** Public shape consumed by the /chat group view. */
export type GroupSocketController = ReturnType<typeof useGroupSocket>;

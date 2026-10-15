import { useCallback } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { websocket } from "../services/websocket";
import { buildOptimisticMessage, formatBytes } from "../_utils/utility";
import { ReplyTarget, User } from "../_utils/types/buyer";

// HELPERS
const MESSAGE_PAGE_SIZE = 20;
const MESSAGE_STALE_TIME = 5 * 60_000;
const MESSAGE_GC_TIME = 30 * 60_000;

const getNextMessagePageParam = (lastPage: any) => {
  const page = Number(lastPage?.messages?.page ?? 1);
  const total = Number(lastPage?.messages?.total ?? 0);
  const pageSize = Number(lastPage?.messages?.page_size ?? MESSAGE_PAGE_SIZE);

  return page * pageSize < total ? page + 1 : undefined;
};

type CachedConversation = {
  id: string;
  peer_id: string;
  user: User;
  last_message: any;
  updated_at: string;
};

const normalizeMessages = (data: any) => {
  if (!data?.messages?.items) return data;

  return {
    ...data,
    messages: {
      ...data.messages,
      items: data.messages.items.map((msg: any) => ({
        ...msg,
        delivery_status: msg.delivery_status ?? "delivered",
        read_at: msg.read_at || null,
      })),
    },
  };
};

const mergePendingIntoFetchedPage = (fetched: any, pendingMessages: any[]) => {
  if (!fetched?.messages?.items || !pendingMessages.length) return fetched;

  const items = [...fetched.messages.items];
  const recentMatch = (serverMessage: any, localMessage: any) => {
    if (
      String(serverMessage?.sender_id ?? "") !== String(localMessage?.sender_id ?? "") ||
      String(serverMessage?.body ?? serverMessage?.caption ?? "") !==
        String(localMessage?.body ?? localMessage?.caption ?? "") ||
      String(serverMessage?.media_type ?? "") !== String(localMessage?.media_type ?? "")
    ) {
      return false;
    }

    const serverTime = new Date(serverMessage?.created_at ?? 0).getTime();
    const localTime = new Date(localMessage?.created_at ?? 0).getTime();
    return (
      Number.isFinite(serverTime) &&
      Number.isFinite(localTime) &&
      Math.abs(serverTime - localTime) <= 60_000
    );
  };

  const matchedServerIndexes = new Set<number>();

  for (const localMessage of pendingMessages) {
    let index = items.findIndex(
      (serverMessage: any, serverIndex: number) =>
        !matchedServerIndexes.has(serverIndex) &&
        sharesMessageIdentity(serverMessage, localMessage),
    );

    // Some older socket/API responses omit client_id, so align the local row
    // with a server row by sender/body/media/time before deciding it's unsaved.
    if (index === -1) {
      index = items.findIndex(
        (serverMessage: any, serverIndex: number) =>
          !matchedServerIndexes.has(serverIndex) &&
          recentMatch(serverMessage, localMessage),
      );
    }

    if (index !== -1) {
      matchedServerIndexes.add(index);
      const serverMessage = items[index];
      items[index] = {
        ...localMessage,
        ...serverMessage,
        client_id: localMessage.client_id || localMessage.id,
        render_id: localMessage.render_id || localMessage.client_id || localMessage.id,
        pending: false,
        synced: true,
        delivery_status: serverMessage.read_at ? "read" : "sent",
      };
      continue;
    }

    items.push(localMessage);
  }

  return {
    ...fetched,
    messages: {
      ...fetched.messages,
      items,
    },
  };
};

const messageIdentityKeys = (message: any) => {
  return [message?.id, message?.client_id, message?.client_message_id]
    .filter((value) => value !== null && value !== undefined && value !== "")
    .map(String);
};

const sharesMessageIdentity = (left: any, right: any) => {
  const leftKeys = new Set(messageIdentityKeys(left));
  return messageIdentityKeys(right).some((key) => leftKeys.has(key));
};

const isUnconfirmedMessage = (message: any) =>
  Boolean(
    message?.pending ||
      message?.delivery_status === "sending" ||
      message?.delivery_status === "uploading" ||
      String(message?.id ?? "").startsWith("temp-"),
  );

// A confirmed optimistic row can still be the only copy in a partial socket
// cache. Keep its temporary render identity until page 1 contains the server
// record, even after its delivery status changes to sent/delivered.
const isLocallyRenderedMessage = (message: any) =>
  isUnconfirmedMessage(message) ||
  String(message?.render_id ?? "").startsWith("temp-") ||
  String(message?.client_id ?? "").startsWith("temp-");

/**
 * When the server omits client_id from chat.message, reconcile an incoming
 * echo with the pending optimistic message rather than rendering a second
 * bubble. This fallback only considers unconfirmed messages from the same
 * sender with the same body/media kind and a recent timestamp.
 */
const isLikelyOptimisticEcho = (candidate: any, incoming: any) => {
  if (!isUnconfirmedMessage(candidate)) return false;
  if (!incoming?.id || incoming?.client_id || candidate?.client_id === incoming.id) {
    return false;
  }
  if (String(candidate?.sender_id ?? "") !== String(incoming?.sender_id ?? "")) {
    return false;
  }
  if (String(candidate?.body ?? candidate?.caption ?? "") !== String(incoming?.body ?? incoming?.caption ?? "")) {
    return false;
  }
  if (String(candidate?.media_type ?? "") !== String(incoming?.media_type ?? "")) {
    return false;
  }

  const candidateTime = new Date(candidate?.created_at ?? 0).getTime();
  const incomingTime = new Date(incoming?.created_at ?? 0).getTime();
  if (!Number.isFinite(candidateTime) || !Number.isFinite(incomingTime)) return false;
  return Math.abs(incomingTime - candidateTime) <= 60_000;
};

const normalizeMergedMessage = (existing: any, incoming: any) => ({
  ...existing,
  ...incoming,
  // Keep the optimistic id as the stable React identity after the server ID
  // arrives. The actual `id` is still the server's ID for API/read operations.
  client_id: incoming?.client_id || existing?.client_id || existing?.id,
  render_id: existing?.render_id || existing?.client_id || existing?.id,
});

export const mergeIntoQuery = (old: any, message: any): any => {
  const emptyState = {
    pages: [
      {
        // Socket/optimistic updates can happen before the server page has been
        // cached. Mark this as partial so opening the chat still hydrates history.
        __needsHistoryFetch: true,
        messages: {
          items: [
            {
              ...message,
              render_id: message?.render_id || message?.client_id || message?.id,
            },
          ],
          page: 1,
          total: 1,
          page_size: MESSAGE_PAGE_SIZE,
        },
      },
    ],
    pageParams: [1],
  };

  if (!old?.pages?.length) return emptyState;

  const pages = old.pages.map((page: any) => ({
    ...page,
    messages: {
      ...page.messages,
      items: [...(page.messages?.items ?? [])],
    },
  }));

  const matches: Array<{ pageIndex: number; itemIndex: number }> = [];
  pages.forEach((page: any, pageIndex: number) => {
    (page.messages.items ?? []).forEach((item: any, itemIndex: number) => {
      if (sharesMessageIdentity(item, message)) {
        matches.push({ pageIndex, itemIndex });
      }
    });
  });

  // Prefer the optimistic row as the merge target. This matters when the
  // REST fetch and chat.message event race and both already contain a server
  // row: updating that row while leaving the temp row untouched creates the
  // exact duplicate/flicker this reconciliation is meant to prevent.
  if (!message?.client_id) {
    const candidates: Array<{
      pageIndex: number;
      itemIndex: number;
      item: any;
      distance: number;
    }> = [];

    pages.forEach((page: any, pageIndex: number) => {
      (page.messages.items ?? []).forEach((item: any, itemIndex: number) => {
        if (!isLikelyOptimisticEcho(item, message)) return;
        candidates.push({
          pageIndex,
          itemIndex,
          item,
          distance: Math.abs(
            new Date(item.created_at).getTime() -
              new Date(message.created_at).getTime(),
          ),
        });
      });
    });

    candidates.sort((a, b) => a.distance - b.distance);
    if (candidates[0]) {
      const optimisticMatch = {
        pageIndex: candidates[0].pageIndex,
        itemIndex: candidates[0].itemIndex,
      };
      matches.unshift(optimisticMatch);
    }
  } else if (matches.length > 1) {
    const clientId = String(message.client_id);
    const priority = (match: { pageIndex: number; itemIndex: number }) => {
      const item = pages[match.pageIndex].messages.items[match.itemIndex];
      if (String(item?.id ?? "") === clientId || String(item?.render_id ?? "") === clientId) return 0;
      if (String(item?.client_id ?? "") === clientId) return 1;
      return 2;
    };
    matches.sort((a, b) => priority(a) - priority(b));
  }

  // Remove duplicate match coordinates before merging/removing rows.
  const uniqueMatches = new Map<string, { pageIndex: number; itemIndex: number }>();
  for (const match of matches) uniqueMatches.set(`${match.pageIndex}:${match.itemIndex}`, match);
  matches.length = 0;
  matches.push(...uniqueMatches.values());

  if (!matches.length) {
    pages[0].messages.items = [
      ...pages[0].messages.items,
      {
        ...message,
        render_id: message?.render_id || message?.client_id || message?.id,
      },
    ];
  } else {
    const first = matches[0];
    const current = pages[first.pageIndex].messages.items[first.itemIndex];
    pages[first.pageIndex].messages.items[first.itemIndex] = normalizeMergedMessage(
      current,
      message,
    );

    // Remove duplicate entries with an overlapping id/client_id alias from all
    // pages, including cases where an ACK and chat.message race one another.
    const duplicateMatches = matches.slice(1).sort(
      (a, b) => b.pageIndex - a.pageIndex || b.itemIndex - a.itemIndex,
    );
    for (const match of duplicateMatches) {
      pages[match.pageIndex].messages.items.splice(match.itemIndex, 1);
    }
  }

  // Global dedupe across pages. Each explicit ID is treated as an alias so a
  // temp ID, client_id, and server ID cannot produce multiple visible bubbles.
  const seen = new Set<string>();
  const dedupedPages = pages.map((page: any) => ({
    ...page,
    messages: {
      ...page.messages,
      items: page.messages.items.filter((item: any) => {
        const keys = messageIdentityKeys(item);
        const fallback = `${item.sender_id}:${item.created_at}:${item.body ?? item.caption ?? ""}`;
        if (!keys.length) keys.push(fallback);
        if (keys.some((key) => seen.has(key))) return false;
        keys.forEach((key) => seen.add(key));
        return true;
      }),
    },
  }));

  return { ...old, pages: dedupedPages };
};

export const replaceOptimisticMessage = (
  old: any,
  clientId: string,
  serverMessage: any,
): any => {
  if (!old?.pages) return old;

  const pages = old.pages.map((page: any) => ({
    ...page,
    messages: {
      ...page.messages,
      items: [...(page.messages?.items ?? [])],
    },
  }));

  const matches: Array<{ pageIndex: number; itemIndex: number }> = [];
  pages.forEach((page: any, pageIndex: number) => {
    page.messages.items.forEach((message: any, itemIndex: number) => {
      if (
        String(message?.id ?? "") === String(clientId) ||
        String(message?.client_id ?? "") === String(clientId) ||
        (serverMessage?.id && String(message?.id ?? "") === String(serverMessage.id)) ||
        (serverMessage?.client_id && String(message?.id ?? "") === String(serverMessage.client_id))
      ) {
        matches.push({ pageIndex, itemIndex });
      }
    });
  });

  if (!matches.length) return old;

  matches.sort((left, right) => {
    const score = (match: { pageIndex: number; itemIndex: number }) => {
      const message = pages[match.pageIndex].messages.items[match.itemIndex];
      if (
        String(message?.id ?? "") === String(clientId) ||
        String(message?.render_id ?? "") === String(clientId)
      ) return 0;
      if (String(message?.client_id ?? "") === String(clientId)) return 1;
      return 2;
    };
    return score(left) - score(right);
  });

  const first = matches[0];
  const existing = pages[first.pageIndex].messages.items[first.itemIndex];
  pages[first.pageIndex].messages.items[first.itemIndex] = {
    ...normalizeMergedMessage(existing, serverMessage),
    client_id:
      serverMessage?.client_id || existing?.client_id || clientId,
    render_id: existing?.render_id || existing?.client_id || clientId,
  };

  const duplicateMatches = matches.slice(1).sort(
    (a, b) => b.pageIndex - a.pageIndex || b.itemIndex - a.itemIndex,
  );
  for (const match of duplicateMatches) {
    pages[match.pageIndex].messages.items.splice(match.itemIndex, 1);
  }

  // A server echo may already have inserted the canonical ID before the ACK;
  // collapse it with the optimistic row so React keeps one stable bubble.
  const seen = new Set<string>();
  const dedupedPages = pages.map((page: any) => ({
    ...page,
    messages: {
      ...page.messages,
      items: page.messages.items.filter((message: any) => {
        const keys = messageIdentityKeys(message);
        if (!keys.length) return true;
        if (keys.some((key) => seen.has(key))) return false;
        keys.forEach((key) => seen.add(key));
        return true;
      }),
    },
  }));

  return { ...old, pages: dedupedPages };
};

const useChat = () => {
  const queryClient = useQueryClient();
  const { authDetails } = useAuth();
  const currentUser = authDetails?.user;

  // CONVERSATIONS
  const useGetConversations = (
    params: { page_size?: number; name?: string } = {},
  ) =>
    useInfiniteQuery({
      queryKey: ["conversations"],

      queryFn: async ({ pageParam = 1 }) => {
        const res = await api.get("/chats/conversations", {
          params: {
            ...params,
            page: pageParam,
          },
        });

        return res.data?.data;
      },

      getNextPageParam: (lastPage: any) => {
        const page = Number(lastPage?.page ?? 1);
        const total = Number(lastPage?.total ?? 0);
        const pageSize = Number(lastPage?.page_size ?? params.page_size ?? 10);

        return page * pageSize < total ? page + 1 : undefined;
      },

      initialPageParam: 1,
      staleTime: MESSAGE_STALE_TIME,
    });

  // MESSAGES

  const fetchMessagesPage = async (
    userId: string,
    page: number,
    pageSize = MESSAGE_PAGE_SIZE,
  ) => {
    const res = await api.get(`/chats/conversations/with/${userId}`, {
      params: { page, page_size: pageSize },
    });

    return normalizeMessages(res.data?.data);
  };

  const useGetMessages = (
    options: {
      userId?: string;
      params?: { page?: number; page_size?: number };
    } = {},
  ) =>
    useInfiniteQuery({
      queryKey: ["messages", options.userId],
      queryFn: async ({ pageParam = 1 }) => {
        const page = Number(pageParam);
        const fetched = await fetchMessagesPage(
          options.userId!,
          page,
          options.params?.page_size || MESSAGE_PAGE_SIZE,
        );

        if (page !== 1) return fetched;

        const cached = queryClient.getQueryData<any>(["messages", options.userId]);
        const localPending =
          cached?.pages?.flatMap((cachedPage: any) => cachedPage?.messages?.items ?? [])
            .filter((item: any) => isLocallyRenderedMessage(item)) ?? [];

        return mergePendingIntoFetchedPage(fetched, localPending);
      },
      getNextPageParam: (lastPage: any) =>
        getNextMessagePageParam({
          messages: {
            ...lastPage?.messages,
            page_size:
              lastPage?.messages?.page_size ??
              options.params?.page_size ??
              MESSAGE_PAGE_SIZE,
          },
        }),
      initialPageParam: 1,
      enabled: Boolean(options.userId),
      staleTime: MESSAGE_STALE_TIME,
      gcTime: MESSAGE_GC_TIME,
      // Usually the sidebar has already prefetched a complete page, so keep
      // chat opening instant. If only a socket/optimistic message was cached,
      // fetch page 1 on mount to hydrate the actual conversation history.
      refetchOnMount: (query) =>
        query.state.isInvalidated ||
        Boolean(
          (query.state.data as any)?.pages?.some(
            (page: any) => page?.__needsHistoryFetch,
          ),
        ),
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    });

  /**
   * Warm the newest message page before the user opens a conversation.
   *
   * We intentionally prefetch only the first page here. Page 1 is the newest
   * messages in this API, so this gives the WhatsApp-style instant-open
   * experience without downloading the entire history for every chat.
   * Older pages are still fetched when the user scrolls upward.
   */
  const prefetchMessages = useCallback(
    async (userId: string) => {
      if (!userId) return;

      await queryClient.prefetchInfiniteQuery({
        queryKey: ["messages", userId],
        queryFn: async ({ pageParam = 1 }) =>
          fetchMessagesPage(userId, Number(pageParam), MESSAGE_PAGE_SIZE),
        initialPageParam: 1,
        getNextPageParam: getNextMessagePageParam,
        staleTime: MESSAGE_STALE_TIME,
        gcTime: MESSAGE_GC_TIME,
      });
    },
    [queryClient],
  );

  // CONVERSATION HELPERS
  const addConversationIfMissing = async ({
    recipient,
    message,
  }: {
    recipient: CachedConversation["user"];
    message: any;
  }) => {
    const conversation: CachedConversation = {
      id: recipient.id,
      peer_id: recipient.id,
      user: {
        id: recipient.id,
        full_name: recipient.full_name,
        username: recipient.username,
        profile_pic: recipient.profile_pic,
      },
      last_message: {
        body: message.body || "",
        caption: message.caption || "",
        media_type: message.media_type || "",
        media_url: message.media_urls?.[0] || message.media_url || "",
        sender_id: currentUser?.id || "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    };

    queryClient.setQueriesData({ queryKey: ["conversations"] }, (old: any) => {
      if (!old?.pages?.length) {
        return {
          pages: [
            {
              items: [conversation],
              page: 1,
              total: 1,
              page_size: 10,
            },
          ],
          pageParams: [1],
        };
      }

      let found = false;
      const pages = old.pages.map((page: any) => {
        const items = [...(page.items ?? [])];
        const index = items.findIndex(
          (c: CachedConversation) =>
            c.peer_id === recipient.id || c.user?.id === recipient.id,
        );

        if (index !== -1) {
          found = true;
          items[index] = {
            ...items[index],
            ...conversation,
          };
        }

        return { ...page, items };
      });

      if (found) return { ...old, pages };

      pages[0] = {
        ...pages[0],
        items: [conversation, ...(pages[0].items ?? [])],
      };

      return { ...old, pages };
    });
  };
  // SEND TEXT MESSAGE
  const transmitMessage = async ({
    recipient,
    body,
    reply_to,
  }: {
    recipient: User;
    body: string;
    reply_to?: ReplyTarget | null;
  }) => {
    if (!currentUser) return;

    const message = buildOptimisticMessage({
      recipient_id: recipient.id,
      body,
      currentUser,
      reply_to_message: reply_to,
    });

    const clientId = String(message.id);
    const messageWithClientId = {
      ...message,
      id: clientId,
      client_id: clientId,
      render_id: clientId,
      pending: true,
      delivery_status: "sending",
    };

    // Start cancellation, but do not await it before updating the cache. The
    // optimistic row is available to React immediately after the click.
    void queryClient.cancelQueries({
      queryKey: ["messages", recipient.id],
      exact: true,
    });

    queryClient.setQueryData(["messages", recipient.id], (old: any) =>
      mergeIntoQuery(old, messageWithClientId),
    );

    void addConversationIfMissing({
      recipient: {
        id: recipient.id,
        full_name: recipient.full_name,
        username: recipient.username,
        profile_pic: recipient.profile_pic,
      },
      message: messageWithClientId,
    });

    websocket.emit("chat.send", {
      recipient_id: recipient.id,
      body,
      client_id: clientId,
      reply_to_message_id: reply_to?.id,
    });
  };

  const confirmMessage = async ({
    clientId,
    serverMessage,
    peerId,
  }: {
    clientId: string;
    serverMessage: any;
    peerId: string;
  }) => {
    queryClient.setQueryData(["messages", peerId], (old: any) =>
      replaceOptimisticMessage(old, clientId, {
        ...serverMessage,
        peer_id: peerId,
        delivery_status: "sent",
        synced: true,
        pending: false,
      }),
    );
  };
  // MEDIA UPLOAD
  const useGetChatSignature = () =>
    useMutation({
      mutationFn: async (payload: { upload_type: string; count: number }) => {
        const res = await api.post("/uploads/chat/sign", payload);
        return res.data?.data;
      },
    });

  const uploadToCloudinary = async (file: File, signature: any) => {
    const fields = signature?.fields;
    if (!fields?.cloud_name || !fields?.api_key || !fields?.timestamp || !fields?.signature) {
      throw new Error("The image upload signature is incomplete. Please try again.");
    }

    const form = new FormData();
    form.append("file", file);
    form.append("api_key", String(fields.api_key));
    form.append("timestamp", String(fields.timestamp));
    form.append("signature", String(fields.signature));

    // Optional signature fields must only be sent when the server actually
    // supplied them; appending undefined turns it into the literal string
    // "undefined", which Cloudinary can interpret as a missing upload preset.
    const appendOptional = (key: string, value: unknown) => {
      if (typeof value !== "string" && typeof value !== "number") return;
      const normalized = String(value).trim();
      if (!normalized || normalized === "undefined" || normalized === "null") return;
      form.append(key, normalized);
    };

    appendOptional("upload_preset", fields.upload_preset);
    appendOptional("folder", fields.folder);
    appendOptional("public_id", fields.public_id);

    const resourceType = signature?.constraints?.resource_type || "image";
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${fields.cloud_name}/${resourceType}/upload`,
      { method: "POST", body: form },
    );
    if (!res.ok) {
      const responseText = await res.text();
      let message = responseText;
      try {
        const parsed = JSON.parse(responseText);
        message = parsed?.error?.message || responseText;
      } catch {
        // Use the raw response text when Cloudinary does not return JSON.
      }
      throw new Error(`Cloudinary upload failed: ${message}`);
    }
    return res.json();
  };

  const prepareOptimisticMedia = async ({
    files,
    recipient,
    type,
    caption = "",
    reply_to,
  }: {
    files: File[];
    recipient: User;
    type: "image" | "video" | "file";
    caption?: string;
    reply_to?: ReplyTarget | null;
  }) => {
    if (!currentUser) return null;

    const localUrls = files.map((file) => URL.createObjectURL(file));

    const optimistic = buildOptimisticMessage({
      recipient_id: recipient.id,
      body: caption,
      media_type: type,
      media_urls: localUrls,
      local_urls: localUrls,
      currentUser,
      delivery_status: "uploading",
      file_name: files.length === 1 ? files[0].name : `${files.length} files`,
      file_size: formatBytes(files.reduce((a, f) => a + f.size, 0)),
      reply_to_message_id: reply_to?.id,
      reply_to_message: reply_to,
    });

    const messageWithClientId = { ...optimistic, client_id: optimistic.id };

    await queryClient.cancelQueries({
      queryKey: ["messages", recipient.id],
    });

    queryClient.setQueryData(["messages", recipient.id], (old: any) =>
      mergeIntoQuery(old, messageWithClientId),
    );

    await addConversationIfMissing({ recipient, message: messageWithClientId });

    return messageWithClientId.id;
  };

  const uploadAndEmitMedia = async ({
    files,
    recipient_id,
    type,
    caption = "",
    signatures,
    clientId,
    reply_to,
  }: {
    files: File[];
    recipient_id: string;
    type: "image" | "video" | "file";
    caption?: string;
    signatures: any;
    clientId: string[];
    reply_to?: ReplyTarget | null;
  }) => {
    try {
      const uploads = await Promise.all(
        files.map((file, index) => uploadToCloudinary(file, signatures[index])),
      );

      const media_urls = uploads.map((u) => u.secure_url);

      queryClient.setQueryData(["messages", recipient_id], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            messages: {
              ...page.messages,
              items: page.messages.items.map((m: any) =>
                clientId.includes(m.id)
                  ? { ...m, media_urls, delivery_status: "sending" }
                  : m,
              ),
            },
          })),
        };
      });

      const stableClientId = clientId[0];

      websocket.emit("chat.upload_media", {
        recipient_id,
        media_urls,
        body: caption,
        client_id: stableClientId,
        media_type: type,
        reply_to_message_id: reply_to?.id,
      });
    } catch (err) {
      console.error("Media upload failed:", err);

      queryClient.setQueryData(["messages", recipient_id], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            messages: {
              ...page.messages,
              items: page.messages.items.map((m: any) =>
                clientId.includes(m.id)
                  ? { ...m, delivery_status: "failed" }
                  : m,
              ),
            },
          })),
        };
      });
    }
  };

  const retryEmitMedia = async ({
    recipient_id,
    media_urls,
    caption,
    clientId,
    reply_to,
  }: {
    recipient_id: string;
    media_urls: string[];
    caption: string;
    clientId: string[];
    reply_to?: ReplyTarget | null;
  }) => {
    websocket.emit("chat.upload_media", {
      recipient_id,
      media_urls,
      body: caption,
      client_id: clientId[0],
      reply_to_message_id: reply_to?.id,
    });
  };

  const markMessageFailed = async (messageId: string, recipientId: string) => {
    queryClient.setQueryData(["messages", recipientId], (old: any) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((page: any) => ({
          ...page,
          messages: {
            ...page.messages,
            items: page.messages.items.map((m: any) =>
              m.id === messageId ? { ...m, delivery_status: "failed" } : m,
            ),
          },
        })),
      };
    });
  };

  return {
    prefetchMessages,
    useGetConversations,
    useGetMessages,
    transmitMessage,
    confirmMessage,
    prepareOptimisticMedia,
    uploadAndEmitMedia,
    useGetChatSignature,
    uploadToCloudinary,
    retryEmitMedia,
    markMessageFailed,
  };
};

export default useChat;

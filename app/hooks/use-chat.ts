import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { websocket } from "../services/websocket";
import { CachedConversation, getChatDB } from "../store/chat-store";
import { buildOptimisticMessage, formatBytes } from "../_utils/utility";
import { ReplyTarget, User } from "../_utils/types/buyer";
import { useEffect, useCallback } from "react";
import { useChatUtils } from "../context/ChatContext";

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

// FIX (Bug 4): mergeIntoQuery always operated on pages[0].messages.items which
// is the correct shape. The real issue was that after a server fetch the pages
// structure becomes pages[0].messages.items (from the queryFn return), so the
// merge path was actually correct — but the dedup check used message.id only.
// Bug 5 (optimistic duplicate) is fixed by also checking client_id here so
// a server-returned message that matches an optimistic client_id is treated as
// already present (and the caller handles the replacement separately).
const mergeIntoQuery = (old: any, message: any): any => {
  const emptyState = {
    pages: [
      {
        messages: {
          items: [message],
          page: 1,
          total: 1,
          page_size: 20,
        },
      },
    ],
    pageParams: [1],
  };

  if (!old) return emptyState;

  const pages = [...old.pages];
  if (!pages[0]?.messages?.items) return emptyState;

  const items: any[] = pages[0].messages.items;

  // FIX (Bug 5): deduplicate by both real id AND client_id so an optimistic
  // message that arrives back from the server doesn't create a duplicate.
  const exists = items.some(
    (m) =>
      m.id === message.id ||
      (message.client_id && m.id === message.client_id) ||
      (m.client_id && m.client_id === message.client_id),
  );
  if (exists) return old;

  pages[0] = {
    ...pages[0],
    messages: {
      ...pages[0].messages,
      items: [...items, message],
    },
  };

  return { ...old, pages };
};

// FIX (Bug 5): replaces the optimistic (temp-id) message with the confirmed
// server message. Called when the socket echoes back the real message.
export const replaceOptimisticMessage = (
  old: any,
  clientId: string,
  serverMessage: any,
): any => {
  if (!old) return old;
  return {
    ...old,
    pages: old.pages.map((page: any) => ({
      ...page,
      messages: {
        ...page.messages,
        items: page.messages.items.map((m: any) =>
          m.id === clientId || m.client_id === clientId ? serverMessage : m,
        ),
      },
    })),
  };
};

// ---------------------------------------------------------------------------
// HOOK
// ---------------------------------------------------------------------------

const useChat = () => {
  const queryClient = useQueryClient();
  const { authDetails } = useAuth();
  const currentUser = authDetails?.user;

  // FIX (Bug 8): never capture chatDB at hook-init time. Always call getDB()
  // inside async functions so they pick up the correct DB instance even if the
  // user changes (e.g. token refresh that swaps userId mid-session).
  const getDB = useCallback(() => {
    if (!currentUser?.id) throw new Error("No user authenticated");
    return getChatDB(currentUser.id);
  }, [currentUser?.id]);

  const { prewarmedCacheRef } = useChatUtils();

  // -------------------------------------------------------------------------
  // CONVERSATIONS
  // -------------------------------------------------------------------------

  const useGetConversations = (params: any = {}) => {
    const qc = useQueryClient();

    // FIX (Bug 2 + Bug 3): hydration effect writes to EXACTLY the same key
    // that useInfiniteQuery reads, and re-runs when the authenticated user
    // changes (not just when queryClient identity changes).
    useEffect(() => {
      if (!currentUser?.id) return;

      const hydrateConversations = async () => {
        const db = getDB();
        const cached = await db.conversations
          .orderBy("updated_at")
          .reverse()
          .toArray();

        if (cached.length > 0) {
          // FIX (Bug 2): use ["conversations", params] — same key as the query
          qc.setQueryData(["conversations", params], {
            pages: [
              {
                items: cached,
                page: 1,
                total: cached.length,
                page_size: cached.length,
              },
            ],
            pageParams: [1],
          });
        }
      };

      hydrateConversations();
      // FIX (Bug 3): depend on userId so this re-runs when the user changes
    }, [currentUser?.id, qc]); // eslint-disable-line react-hooks/exhaustive-deps

    return useInfiniteQuery({
      queryKey: ["conversations", params],
      queryFn: async ({ pageParam = 1 }) => {
        try {
          const db = getDB(); // FIX (Bug 8): call getDB() here, not at top
          const res = await api.get("/chats/conversations", {
            params: { ...params, page: pageParam },
          });

          const data = res.data?.data;
          const items = data?.items;

          if (items?.length && pageParam === 1) {
            // FIX (Bug 9): server items already carry the correct id — just
            // ensure peer_id is backfilled before persisting.
            const itemsWithPeer = items.map((c: any) => ({
              ...c,
              peer_id: c.peer_id ?? c.user?.id ?? c.user_id,
            }));
            await db.conversations.bulkPut(itemsWithPeer);
          }

          return data;
        } catch (err) {
          console.error("Failed to sync conversations:", err);
          return null;
        }
      },
      getNextPageParam: (lastPage: any) => {
        if (!lastPage) return undefined;
        const { page, total, page_size } = lastPage;
        return page * page_size < total ? page + 1 : undefined;
      },
      initialPageParam: 1,
      staleTime: 1000 * 60,
    });
  };

  // -------------------------------------------------------------------------
  // MESSAGES
  // -------------------------------------------------------------------------

  const normalizeMessage = (message: any) => ({
    ...message,
    delivery_status: message.delivery_status ?? "sent",
    synced: message.synced ?? true,
  });

  const useGetMessages = (options: {
    userId: string;
    params?: { page_size?: number };
  }) => {
    const { prewarmedCacheRef } = useChatUtils();

    return useInfiniteQuery({
      queryKey: ["messages", options.userId],

      // FIX (Bug 7): use placeholderData instead of initialData.
      // initialData tells React Query "I already have fresh data — skip fetch".
      // placeholderData shows the cached rows instantly AND still fires the
      // server fetch in the background, so messages are never stale.
      placeholderData: () =>
        prewarmedCacheRef.current[options.userId] ?? undefined,

      queryFn: async ({ pageParam = 1 }) => {
        const db = getDB(); // FIX (Bug 8)

        try {
          const localStuck =
            pageParam === 1
              ? await db.messages
                  .where("peer_id")
                  .equals(options.userId)
                  .filter((m: any) =>
                    ["pending", "uploading", "sending", "failed"].includes(
                      m.delivery_status ?? "",
                    ),
                  )
                  .toArray()
              : [];

          const res = await api.get(
            `/chats/conversations/with/${options.userId}`,
            {
              params: {
                page: pageParam,
                page_size: options.params?.page_size || 20,
              },
            },
          );

          const data = res.data?.data;
          const rawItems = data?.messages?.items || [];

          const items = rawItems.map((m: any) =>
            normalizeMessage({
              ...m,
              peer_id: options.userId,
              delivery_status: "sent",
              synced: true,
            }),
          );

          if (pageParam === 1 && items.length > 0) {
            await db.messages.bulkPut(items);
          }

          const serverIds = new Set(items.map((m: any) => m.id));
          const stillStuck = localStuck.filter(
            (m: any) => !serverIds.has(m.id),
          );

          return {
            ...data,
            messages: {
              ...data.messages,
              items: [...items, ...stillStuck],
            },
          };
        } catch (err) {
          console.error("Fetch failed, falling back to IndexedDB:", err);
          const cached = await db.messages
            .where("peer_id")
            .equals(options.userId)
            .sortBy("created_at");

          return {
            messages: {
              items: cached.map((msg) => ({
                ...msg,
                delivery_status: msg.delivery_status || "sent",
              })),
              page: 1,
              total: cached.length,
              page_size: cached.length,
            },
          };
        }
      },
      initialPageParam: 1,
      getNextPageParam: (lastPage: any) => {
        if (!lastPage?.messages) return undefined;
        const { page, total, page_size } = lastPage.messages;
        return page * page_size < total ? page + 1 : undefined;
      },
      enabled: !!options.userId,
      staleTime: 1000 * 30,
      retry: false,
    });
  };

  // -------------------------------------------------------------------------
  // CONVERSATION HELPERS
  // -------------------------------------------------------------------------

  const addConversationIfMissing = async ({
    recipient,
    message,
  }: {
    recipient: CachedConversation["user"];
    message: any;
  }) => {
    const db = getDB(); // FIX (Bug 8)

    // FIX (Bug 9): look up by peer_id (recipient.id), not by primary key, so
    // we don't create a duplicate when the server uses a different id format.
    const existingInDB = await db.conversations
      .where("peer_id")
      .equals(recipient.id)
      .first();

    if (existingInDB) return;

    const conversation: CachedConversation = {
      // Use recipient.id as the temporary id for optimistic entries.
      // When the server syncs, bulkPut will overwrite with the real id because
      // we added peer_id as a separate index (Bug 9 fix in chat-store).
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

    await db.conversations.put(conversation);

    queryClient.setQueryData(["conversations"], (old: any) => {
      if (old) {
        // FIX (Bug 9): check by peer_id not by conversation id
        const existsInCache = old.pages.some((page: any) =>
          page.items?.some(
            (c: CachedConversation) => c.peer_id === recipient.id,
          ),
        );
        if (existsInCache) return old;

        const pages = [...old.pages];
        pages[0] = {
          ...pages[0],
          items: [conversation, ...(pages[0].items ?? [])],
        };
        return { ...old, pages };
      }

      return {
        pages: [{ items: [conversation], page: 1, total: 1, page_size: 10 }],
        pageParams: [1],
      };
    });
  };

  // -------------------------------------------------------------------------
  // SEND TEXT MESSAGE
  // -------------------------------------------------------------------------

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
    const db = getDB(); // FIX (Bug 8)

    const message = buildOptimisticMessage({
      recipient_id: recipient.id,
      body,
      currentUser,
      reply_to_message: reply_to,
    });

    // Attach client_id so socket handler can match the ack
    const messageWithClientId = { ...message, client_id: message.id };

    queryClient.setQueryData(["messages", recipient.id], (old: any) =>
      mergeIntoQuery(old, messageWithClientId),
    );

    const messageToSave = {
      ...messageWithClientId,
      peer_id:
        messageWithClientId.recipient_id === currentUser.id
          ? messageWithClientId.sender_id
          : messageWithClientId.recipient_id,
    };

    await db.messages.put(messageToSave); // FIX (Bug 10): was missing in original transmitMessage; now awaited

    await addConversationIfMissing({
      recipient: {
        id: recipient.id,
        full_name: recipient.full_name,
        username: recipient.username,
        profile_pic: recipient.profile_pic,
      },
      message,
    });

    websocket.emit("chat.send", {
      recipient_id: recipient.id,
      body,
      client_id: message.id, // FIX (Bug 5): always send client_id for ack matching
      reply_to_message_id: reply_to?.id,
    });
  };

  // FIX (Bug 5): call this from your socket event handler when the server
  // echoes back the confirmed message. It replaces the optimistic entry with
  // the real one (new id, confirmed delivery_status, etc.) and persists it.
  const confirmMessage = async ({
    clientId,
    serverMessage,
    peerId,
  }: {
    clientId: string;
    serverMessage: any;
    peerId: string;
  }) => {
    const db = getDB();

    // Replace optimistic in React Query cache
    queryClient.setQueryData(["messages", peerId], (old: any) =>
      replaceOptimisticMessage(old, clientId, {
        ...serverMessage,
        peer_id: peerId,
        delivery_status: "sent",
        synced: true,
      }),
    );

    // Replace in IndexedDB: delete old temp record, write confirmed one
    await db.messages.delete(clientId);
    await db.messages.put({
      ...serverMessage,
      peer_id: peerId,
      delivery_status: "sent",
      synced: true,
    });
  };

  // -------------------------------------------------------------------------
  // MEDIA UPLOAD
  // -------------------------------------------------------------------------

  const useGetChatSignature = () =>
    useMutation({
      mutationFn: async (payload: { upload_type: string; count: number }) => {
        const res = await api.post("/uploads/chat/sign", payload);
        return res.data?.data;
      },
    });

  const uploadToCloudinary = async (file: File, signature: any) => {
    const form = new FormData();
    form.append("file", file);
    form.append("api_key", signature.fields.api_key);
    form.append("timestamp", String(signature.fields.timestamp));
    form.append("signature", signature.fields.signature);
    form.append("upload_preset", signature.fields.upload_preset);
    form.append("folder", signature.fields.folder);
    form.append("public_id", signature.fields.public_id);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${signature.fields.cloud_name}/${signature.constraints.resource_type}/upload`,
      { method: "POST", body: form },
    );
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  };

  // Step 1: instant optimistic media message
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
    const db = getDB(); // FIX (Bug 8)

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

    queryClient.setQueryData(["messages", recipient.id], (old: any) =>
      mergeIntoQuery(old, messageWithClientId),
    );

    const messageToSave = {
      ...messageWithClientId,
      peer_id:
        messageWithClientId.recipient_id === currentUser.id
          ? messageWithClientId.sender_id
          : messageWithClientId.recipient_id,
    };

    // FIX (Bug 10): await the put so it's never silently dropped on unmount
    await db.messages.put(messageToSave);

    await addConversationIfMissing({ recipient, message: messageWithClientId });

    return messageWithClientId.id;
  };

  // Step 2: upload to Cloudinary then emit socket event
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
    const db = getDB(); // FIX (Bug 8)

    try {
      const uploads = await Promise.all(
        files.map((file, index) => uploadToCloudinary(file, signatures[index])),
      );

      const media_urls = uploads.map((u) => u.secure_url);

      // Update optimistic message: uploading → sending
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

      // Persist updated URLs to IndexedDB
      for (const id of clientId) {
        await db.messages.update(id, {
          media_urls,
          delivery_status: "sending",
        });
      }

      websocket.emit("chat.upload_media", {
        recipient_id,
        media_urls,
        body: caption,
        client_id: clientId[0],
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

      for (const id of clientId) {
        await db.messages.update(id, { delivery_status: "failed" });
      }
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
    const db = getDB(); // FIX (Bug 8)

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

    await db.messages.update(messageId, { delivery_status: "failed" });
  };

  return {
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

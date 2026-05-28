import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { websocket } from "../services/websocket";
import { CachedConversation, getChatDB } from "../store/chat-store";
import { buildOptimisticMessage, formatBytes } from "../_utils/utility";
import { ReplyTarget, User } from "../_utils/types/buyer";
import { useEffect } from "react";

const mergeIntoQuery = (old: any, message: any) => {
  if (!old) {
    return {
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
  }

  const pages = [...old.pages];

  const items = pages[0].messages.items;

  const exists = items.some((m: any) => m.id === message.id);
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

const useChat = () => {
  const queryClient = useQueryClient();
  const { authDetails } = useAuth();
  const currentUser = authDetails?.user;
  const getDB = () => {
    if (!currentUser) throw new Error("No user authenticated");
    return getChatDB(currentUser.id);
  };

  const chatDB = getDB();

  const useGetConversations = (params: any = {}) => {
    const queryClient = useQueryClient();
    const chatDB = getDB();

    // 1. Hydrate Conversations from IndexedDB
    useEffect(() => {
      const hydrateConversations = async () => {
        const cached = await chatDB.conversations
          .orderBy("updated_at")
          .reverse()
          .toArray();

        if (cached.length > 0) {
          queryClient.setQueryData(["conversations", params], {
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
    }, [queryClient]);

    // 2. Infinite Query for Conversations
    return useInfiniteQuery({
      queryKey: ["conversations", params],
      queryFn: async ({ pageParam = 1 }) => {
        try {
          const res = await api.get("/chats/conversations", {
            params: { ...params, page: pageParam },
          });

          const data = res.data?.data;
          const items = data?.items;

          // Persist fresh server data to IndexedDB
          if (items && pageParam === 1) {
            await chatDB.conversations.clear(); // Clear old list to sync perfectly
            await chatDB.conversations.bulkPut(items);
          }

          return data;
        } catch (err) {
          console.error("Failed to sync conversations:", err);
          return null; // Return null to preserve existing cache
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

  // ---------------- MESSAGES ----------------
  const normalizeMessage = (message: any) => ({
    ...message,
    delivery_status: message.delivery_status ?? "sent",
    synced: message.synced ?? true,
  });

  const useGetMessages = (options: {
    userId: string;
    params?: { page_size?: number };
  }) => {
    const chatDB = getDB();

    return useInfiniteQuery({
      queryKey: ["messages", options.userId],

      queryFn: async ({ pageParam = 1 }) => {
        try {
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
          const items = (data?.messages?.items || []).map((m: any) =>
            normalizeMessage({
              ...m,
              conversation_id: options.userId,
              synced: true,
            }),
          );

          if (items.length) await chatDB.messages.bulkPut(items);

          return { ...data, messages: { ...data.messages, items } };
        } catch (err) {
          console.error("Background sync failed, keeping cache:", err);
          // Return null — React Query keeps existing pages intact.
          // User still sees IndexedDB data. No messages disappear.
          return null;
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
      placeholderData: (prev: any) => prev,
      retry: false, // Don't retry 60s timeouts — IndexedDB data is already shown
    });
  };

  const addConversationIfMissing = async ({
    recipient,
    message,
  }: {
    recipient: CachedConversation["user"];
    message: any;
  }) => {
    // CHECK DB
    const existingInDB = await chatDB.conversations
      .filter((c) => c.user.id === recipient.id)
      .first();

    if (existingInDB) return;

    const conversation: CachedConversation = {
      id: recipient.id,
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

    // SAVE TO DB
    await chatDB.conversations.put(conversation);

    // UPDATE CACHE
    queryClient.setQueryData(["conversations"], (old: any) => {
      // CACHE EXISTS
      if (old) {
        const existsInCache = old.pages.some((page: any) =>
          page.items.some(
            (c: CachedConversation) => c.user.id === recipient.id,
          ),
        );

        if (existsInCache) return old;

        const pages = [...old.pages];

        pages[0] = {
          ...pages[0],
          items: [conversation, ...pages[0].items],
        };

        return {
          ...old,
          pages,
        };
      }

      // NO CACHE YET
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
    });
  };

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

    queryClient.setQueryData(["messages", recipient.id], (old: any) =>
      mergeIntoQuery(old, message),
    );

    const messageToSave = {
      ...message,
      // Force the ID mapping here at the point of entry
      conversation_id:
        message.recipient_id === currentUser.id
          ? message.sender_id
          : message.recipient_id,
    };
    await chatDB.messages.put(messageToSave);

    await addConversationIfMissing({
      recipient: {
        id: recipient.id,
        full_name: recipient.full_name,
        username: recipient.username,
        profile_pic: recipient.profile_pic,
      },
      message,
    });
    // WebSocket
    websocket.emit("chat.send", {
      recipient_id: recipient.id,
      body,
      reply_to_message_id: reply_to?.id,
    });
  };

  const useGetChatSignature = () =>
    useMutation({
      mutationFn: async (payload: { upload_type: string; count: number }) => {
        const res = await api.post("/uploads/chat/sign", payload);
        return res.data?.data;
      },
    });

  // ---------------- CLOUD UPLOAD ----------------
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
      {
        method: "POST",
        body: form,
      },
    );

    if (!res.ok) throw new Error(await res.text());
    return res.json();
  };

  // Step 1: instant — puts optimistic message in cache and returns the id
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

    // Store client_id so socket handler can match optimistic → server response
    const messageWithClientId = {
      ...optimistic,
      client_id: optimistic.id,
    };

    queryClient.setQueryData(["messages", recipient.id], (old: any) =>
      mergeIntoQuery(old, messageWithClientId),
    );

    const messageToSave = {
      ...messageWithClientId,
      // Force the ID mapping here at the point of entry
      conversation_id:
        messageWithClientId.recipient_id === currentUser.id
          ? messageWithClientId.sender_id
          : messageWithClientId.recipient_id,
    };
    chatDB.messages.put(messageToSave);
    await addConversationIfMissing({
      recipient,
      message: messageWithClientId,
    });

    return messageWithClientId.id;
  };

  // Step 2: background — upload and emit socket event

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
      // upload all files in parallel
      const uploads = await Promise.all(
        files.map((file, index) => {
          const signatureObj = signatures[index];
          return uploadToCloudinary(file, signatureObj);
        }),
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
                  ? {
                      ...m,
                      media_urls,
                      delivery_status: "sending",
                    }
                  : m,
              ),
            },
          })),
        };
      });

      websocket.emit("chat.upload_media", {
        recipient_id,
        media_urls,
        body: caption,
        client_id: clientId[0], // Send the client_id so server can echo it back
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
                  ? {
                      ...m,
                      delivery_status: "failed",
                    }
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
  return {
    useGetConversations,
    useGetMessages,
    transmitMessage,
    prepareOptimisticMedia,
    uploadAndEmitMedia,
    useGetChatSignature,
    uploadToCloudinary,
    retryEmitMedia,
  };
};

export default useChat;

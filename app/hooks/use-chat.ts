import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { websocket } from "../services/websocket";
import { CachedConversation } from "../store/chat-store";
import { buildOptimisticMessage, formatBytes } from "../_utils/utility";
import { ReplyTarget, User } from "../_utils/types/buyer";

// HELPERS
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

  const index = items.findIndex(
    (m) =>
      m.client_id === message.client_id ||
      m.id === message.id ||
      (message.client_id && m.id === message.client_id),
  );

  if (index !== -1) {
    items[index] = {
      ...items[index],
      ...message,
    };
  } else {
    items.push(message);
  }

  pages[0] = {
    ...pages[0],
    messages: {
      ...pages[0].messages,
      items: [...items, message],
    },
  };

  return { ...old, pages };
};

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
          m.id === clientId || m.client_id === clientId
            ? { ...m, ...serverMessage }
            : m,
        ),
      },
    })),
  };
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
        const { page, total, page_size } = lastPage;

        const hasMore = page * page_size < total;

        return hasMore ? page + 1 : undefined;
      },

      initialPageParam: 1,
    });
  // MESSAGES

  const prefetchMessages = (userId: string) => {
    queryClient.prefetchInfiniteQuery({
      queryKey: ["messages", userId],
      queryFn: async ({ pageParam = 1 }) => {
        const res = await api.get(`/chats/conversations/with/${userId}`, {
          params: { page: pageParam, page_size: 20 },
        });
        const data = res.data?.data;

        // Keep the transformation logic consistent
        if (data?.messages?.items) {
          data.messages.items = data.messages.items.map((msg: any) => ({
            ...msg,
            delivery_status: "delivered",
            read_at: msg.read_at || null,
          }));
        }
        return data;
      },
      initialPageParam: 1,
    });
  };

  const useGetMessages = (
    options: {
      userId?: string;
      params?: { page?: number; page_size?: number };
    } = { params: { page_size: 10 } },
  ) =>
    useInfiniteQuery({
      queryKey: ["messages", options.userId],

      queryFn: async ({ pageParam = 1 }) => {
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

        // Transform the messages before returning them to the cache
        if (data?.messages?.items) {
          data.messages.items = data.messages.items.map((msg: any) => ({
            ...msg,
            delivery_status: "delivered",
            read_at: msg.read_at || null,
          }));
        }

        return data;
      },

      getNextPageParam: (lastPage: any) => {
        const { page, total, page_size } = lastPage?.messages || {};

        const hasMore = page * page_size < total;
        return hasMore ? page + 1 : undefined;
      },

      initialPageParam: 1,
      enabled: !!options.userId,
    });

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

    // FIX: use ["conversations", {}] to match the actual registered query key
    queryClient.setQueryData(["conversations", {}], (old: any) => {
      if (old) {
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

    const messageWithClientId = {
      ...message,
      id: message.id,
      client_id: message.id,
      pending: true,
    };
    queryClient.setQueryData(["messages", recipient.id], (old: any) =>
      mergeIntoQuery(old, messageWithClientId),
    );

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
      client_id: message.id,
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
    useGetConversations,
    useGetMessages,
    prefetchMessages,
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

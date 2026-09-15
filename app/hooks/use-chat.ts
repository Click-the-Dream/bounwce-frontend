import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { websocket } from "../services/websocket";
import { buildOptimisticMessage, formatBytes } from "../_utils/utility";
import { ReplyTarget, User } from "../_utils/types/buyer";

// HELPERS
const MESSAGE_PAGE_SIZE = 20;
const MESSAGE_STALE_TIME = 30_000;

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

export const mergeIntoQuery = (old: any, message: any): any => {
  const emptyState = {
    pages: [
      {
        messages: {
          items: [message],
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

  let found = false;

  for (const page of pages) {
    const items = page.messages.items;
    const index = items.findIndex(
      (item: any) =>
        (message.id && item.id === message.id) ||
        (message.client_id && item.client_id === message.client_id) ||
        (message.client_id && item.id === message.client_id),
    );

    if (index !== -1) {
      items[index] = { ...items[index], ...message };
      found = true;
      break;
    }
  }

  if (!found) {
    pages[0].messages.items = [...pages[0].messages.items, message];
  }

  const seen = new Set<string>();
  const dedupedPages = pages.map((page: any) => ({
    ...page,
    messages: {
      ...page.messages,
      items: page.messages.items.filter((item: any) => {
        const key =
          item.id ||
          item.client_id ||
          `${item.sender_id}:${item.created_at}:${item.body ?? ""}`;

        if (seen.has(key)) return false;
        seen.add(key);
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

  return {
    ...old,
    pages: old.pages.map((page: any) => ({
      ...page,
      messages: {
        ...page.messages,
        items: (page.messages?.items ?? []).map((m: any) =>
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
      queryFn: async ({ pageParam = 1 }) =>
        fetchMessagesPage(
          options.userId!,
          Number(pageParam),
          options.params?.page_size || MESSAGE_PAGE_SIZE,
        ),
      getNextPageParam: (lastPage: any) => {
        const page = Number(lastPage?.messages?.page ?? 1);
        const total = Number(lastPage?.messages?.total ?? 0);
        const pageSize = Number(
          lastPage?.messages?.page_size ??
            options.params?.page_size ??
            MESSAGE_PAGE_SIZE,
        );
        return page * pageSize < total ? page + 1 : undefined;
      },
      initialPageParam: 1,
      enabled: Boolean(options.userId),
      staleTime: MESSAGE_STALE_TIME,
      refetchOnMount: true,
      refetchOnWindowFocus: false,
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

    const messageWithClientId = {
      ...message,
      id: message.id,
      client_id: message.id,
      pending: true,
    };
    await queryClient.cancelQueries({
      queryKey: ["messages", recipient.id],
    });

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

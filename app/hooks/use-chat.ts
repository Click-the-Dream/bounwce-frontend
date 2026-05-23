import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { websocket } from "../services/websocket";
import { getChatDB } from "../store/chat-store";
import { buildOptimisticMessage, formatBytes } from "../_utils/utility";
import { ReplyTarget } from "../_utils/types/buyer";

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

  const useGetConversations = (params = {}) =>
    useInfiniteQuery({
      queryKey: ["conversations"],
      queryFn: async ({ pageParam = 1 }) => {
        // 1. FAST PATH: Load from IndexedDB
        if (pageParam === 1) {
          const cached = await chatDB.conversations
            .orderBy("updated_at")
            .reverse()
            .toArray();
          if (cached.length > 0) {
            return {
              items: cached,
              page: 1,
              total: cached.length,
              page_size: cached.length,
            };
          }
        }

        // 2. Fallback to API
        const res = await api.get("/chats/conversations", {
          params: { ...params, page: pageParam },
        });

        const data = res.data?.data;
        const items = data?.items;

        // 3. Persist to IndexedDB
        if (items && pageParam === 1) {
          await chatDB.conversations.bulkPut(items);
        }

        return data;
      },
      getNextPageParam: (lastPage: any) => {
        const { page, total, page_size } = lastPage;
        return page * page_size < total ? page + 1 : undefined;
      },
      initialPageParam: 1,
    });

  // ---------------- MESSAGES ----------------
  const useGetMessages = (options: any = {}) =>
    useInfiniteQuery({
      queryKey: ["messages", options.userId],

      queryFn: async ({ pageParam = 1 }) => {
        const userId = options.userId;
        const pageSize = options.params?.page_size || 20;

        const res = await api.get(`/chats/conversations/with/${userId}`, {
          params: {
            page: pageParam,
            page_size: pageSize,
          },
        });

        const data = res.data?.data;

        const items = data?.messages?.items || [];

        if (items.length) {
          await chatDB.messages.bulkPut(
            items.map((m: any) => ({
              ...m,
              conversation_id: userId,
              synced: true,
            })),
          );
        }

        return data;
      },

      initialPageParam: 1,

      getNextPageParam: (lastPage: any) => {
        const messages = lastPage?.messages;

        if (!messages) return undefined;

        const { page, total, page_size } = messages;

        return page * page_size < total ? page + 1 : undefined;
      },

      enabled: !!options.userId,

      staleTime: 1000 * 30,

      gcTime: 1000 * 60 * 30,
    });

  const transmitMessage = async ({
    recipient_id,
    body,
    reply_to,
  }: {
    recipient_id: string;
    body: string;
    reply_to?: ReplyTarget | null;
  }) => {
    if (!currentUser) return;

    const message = buildOptimisticMessage({
      recipient_id,
      body,
      currentUser,
      reply_to_message: reply_to,
    });

    queryClient.setQueryData(["messages", recipient_id], (old: any) =>
      mergeIntoQuery(old, message),
    );

    await chatDB.messages.put(message);

    // 3. WebSocket
    websocket.emit("chat.send", {
      recipient_id,
      body,
      reply_to_message_id: reply_to?.id,
    });
  };

  const useGetChatSignature = () =>
    useMutation({
      mutationFn: async (payload: { uploadType: string; count: number }) => {
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
  const prepareOptimisticMedia = ({
    files,
    recipient_id,
    type,
    caption = "",
    reply_to,
  }: {
    files: File[];
    recipient_id: string;
    type: "image" | "video" | "file";
    caption?: string;
    reply_to?: ReplyTarget | null;
  }) => {
    if (!currentUser) return null;

    const localUrls = files.map((file) => URL.createObjectURL(file));

    const optimistic = buildOptimisticMessage({
      recipient_id,
      body: caption,
      media_type: type,
      media_urls: localUrls,
      local_urls: localUrls,
      currentUser,
      file_name: files.length === 1 ? files[0].name : `${files.length} files`,
      file_size: formatBytes(files.reduce((a, f) => a + f.size, 0)),
      reply_to_message_id: reply_to?.id,
      reply_to_message: reply_to,
    });

    queryClient.setQueryData(["messages", recipient_id], (old: any) =>
      mergeIntoQuery(old, optimistic),
    );

    chatDB.messages.put(optimistic);

    return optimistic.id;
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

      websocket.emit("chat.upload_media", {
        recipient_id,
        media_urls,
        body: caption,
        client_id: clientId,
        media_type: type,
        reply_to_message_id: reply_to?.id,
      });
    } catch (err) {
      console.error("Media upload failed:", err);
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
      client_id: clientId,
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

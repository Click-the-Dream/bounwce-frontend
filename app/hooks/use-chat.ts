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

  // ---------------- MESSAGES (OFFLINE-FIRST) ----------------
  const useGetMessages = (options: any = {}) =>
    useInfiniteQuery({
      queryKey: ["messages", options.userId],

      queryFn: async ({ pageParam = 1 }) => {
        const userId = options.userId;

        // 1. Load IndexedDB first (FAST PATH)
        const cached = await chatDB.messages
          .where("conversation_id")
          .equals(userId)
          .toArray();

        if (cached.length && pageParam === 1) {
          return {
            messages: {
              items: cached,
              page: 1,
              total: cached.length,
              page_size: cached.length,
            },
          };
        }

        // 2. fallback to server
        const res = await api.get(`/chats/conversations/with/${userId}`, {
          params: {
            page: pageParam,
            page_size: options.params?.page_size || 20,
          },
        });

        const data = res.data?.data;
        const items = data?.messages?.items;

        // Persist to IndexedDB immediately after successful fetch
        if (items) {
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

      staleTime: 1000 * 60 * 5, //5mins
      gcTime: 1000 * 60 * 30,

      getNextPageParam: (lastPage: any) => {
        const { page, total, page_size } = lastPage?.messages || {};
        return page * page_size < total ? page + 1 : undefined;
      },

      initialPageParam: 1,
      enabled: !!options.userId,
    });

  // ---------------- SEND MESSAGE ----------------
  const transmitMessage = async ({
    recipient_id,
    body,
  }: {
    recipient_id: string;
    body: string;
  }) => {
    if (!currentUser) return;

    const message = buildOptimisticMessage({
      recipient_id,
      body,
      currentUser,
    });

    // 1. React Query cache
    queryClient.setQueryData(["messages", recipient_id], (old: any) =>
      mergeIntoQuery(old, message),
    );

    // 2. IndexedDB
    await chatDB.messages.put(message);

    // 3. WebSocket
    websocket.emit("chat.send", {
      recipient_id,
      body,
    });
  };

  // ---------------- SIGNATURES ----------------
  const useGetChatImageSignature = () =>
    useMutation({
      mutationFn: async () => {
        const res = await api.post("/uploads/chat-image/sign");
        return res.data?.data;
      },
    });

  const useGetChatVideoSignature = () =>
    useMutation({
      mutationFn: async () => {
        const res = await api.post("/uploads/chat-video/sign");
        return res.data?.data;
      },
    });

  const useGetChatFileSignature = () =>
    useMutation({
      mutationFn: async () => {
        const res = await api.post("/uploads/chat-file/sign");
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
    file,
    recipient_id,
    type,
    caption = "",
  }: {
    file: File;
    recipient_id: string;
    type: "image" | "video" | "file";
    caption?: string;
  }) => {
    if (!currentUser) return null;

    const localUrl = URL.createObjectURL(file);

    const optimistic = buildOptimisticMessage({
      recipient_id,
      body: caption,
      media_type: type,
      media_url: localUrl,
      local_url: localUrl,
      currentUser,
      file_name: file.name,
      file_size: formatBytes(file.size),
    });

    // Sync — no await, no network
    queryClient.setQueryData(["messages", recipient_id], (old: any) =>
      mergeIntoQuery(old, optimistic),
    );

    chatDB.messages.put(optimistic); // fire and forget

    return optimistic.id;
  };

  // Step 2: background — upload and emit socket event

  const uploadAndEmitMedia = async ({
    files,
    recipient_id,
    type,
    caption = "",
    signature,
    clientIds,
  }: {
    files: File[];
    recipient_id: string;
    type: "image" | "video" | "file";
    caption?: string;
    signature: any;
    clientIds: string[];
  }) => {
    try {
      // upload all files in parallel
      const uploads = await Promise.all(
        files.map((file) => uploadToCloudinary(file, signature)),
      );

      const media_url = uploads.map((u) => u.secure_url);

      const eventMap = {
        image: "chat.upload_image",
        video: "chat.upload_video",
        file: "chat.upload_file",
      };

      websocket.emit(eventMap[type], {
        recipient_id,
        media_url,
        body: caption,
        client_id: clientIds,
      });

      // remove pending state
      queryClient.setQueryData(["messages", recipient_id], (old: any) => {
        if (!old) return old;

        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            messages: {
              ...page.messages,
              items: page.messages.items.map((m: any) =>
                clientIds.includes(m.id)
                  ? {
                      ...m,
                      pending: false,
                    }
                  : m,
              ),
            },
          })),
        };
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
                clientIds.includes(m.id)
                  ? {
                      ...m,
                      failed: true,
                      pending: false,
                    }
                  : m,
              ),
            },
          })),
        };
      });
    }
  };

  return {
    useGetConversations,
    useGetMessages,
    transmitMessage,
    prepareOptimisticMedia,
    uploadAndEmitMedia,
    useGetChatImageSignature,
    useGetChatVideoSignature,
    useGetChatFileSignature,
    uploadToCloudinary,
  };
};

export default useChat;

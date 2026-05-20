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
  const transmitMessage = async (payload: {
    recipient_id: string;
    body: string;
  }) => {
    if (!currentUser) return;

    const message = {
      id: `temp-${Date.now()}`,
      body: payload.body,
      sender_id: currentUser.id,
      recipient_id: payload.recipient_id,
      conversation_id: payload.recipient_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      pending: true,
      synced: false,
    };

    // 1. React Query
    queryClient.setQueryData(["messages", payload.recipient_id], (old: any) =>
      mergeIntoQuery(old, message),
    );

    // 2. IndexedDB (offline persistence)
    await chatDB.messages.put(message);

    // 3. WebSocket send
    websocket.emit("chat.send", {
      recipient_id: payload.recipient_id,
      body: payload.body,
    });
  };

  // ---------------- MEDIA ----------------
  const transmitImageMessage = (p: any) =>
    websocket.emit("chat.upload_image", p);

  const transmitVideoMessage = (p: any) =>
    websocket.emit("chat.upload_video", p);

  const transmitFileMessage = (p: any) => websocket.emit("chat.upload_file", p);

  // ---------------- SIGNATURES ----------------
  const useGetChatImageSignature = () =>
    useMutation({
      mutationFn: async () => {
        const res = await api.post("/uploads/chat-image/sign");
        return res.data?.data?.fields;
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
        return res.data?.data?.fields;
      },
    });

  // ---------------- CLOUD UPLOAD ----------------
  const uploadToCloudinary = async (file: File, signature: any) => {
    const form = new FormData();

    form.append("file", file);
    form.append("api_key", signature.api_key);
    form.append("timestamp", String(signature.timestamp));
    form.append("signature", signature.signature);
    form.append("upload_preset", signature.upload_preset);
    form.append("folder", signature.folder);
    form.append("public_id", signature.public_id);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${signature.cloud_name}/${signature.constraints.resource_type}/upload`,
      {
        method: "POST",
        body: form,
      },
    );

    if (!res.ok) throw new Error(await res.text());
    return res.json();
  };

  return {
    useGetConversations,
    useGetMessages,
    transmitMessage,
    transmitImageMessage,
    transmitVideoMessage,
    transmitFileMessage,
    useGetChatImageSignature,
    useGetChatVideoSignature,
    useGetChatFileSignature,
    uploadToCloudinary,
  };
};

export default useChat;

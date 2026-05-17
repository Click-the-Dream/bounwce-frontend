import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { websocket } from "../services/websocket";

const useChat = () => {
  const queryClient = useQueryClient();
  const { authDetails } = useAuth();
  const currentUser = authDetails?.user;
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

  const useGetConversation = (conversationId?: string) =>
    useQuery({
      queryKey: ["conversation", conversationId],
      queryFn: async () => {
        const res = await api.get(`/chats/conversations/${conversationId}`);
        return res.data.data;
      },
      enabled: !!conversationId,
    });

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

        return res.data?.data;
      },

      getNextPageParam: (lastPage: any) => {
        const { page, total, page_size } = lastPage?.messages || {};

        const hasMore = page * page_size < total;
        return hasMore ? page + 1 : undefined;
      },

      initialPageParam: 1,
      enabled: !!options.userId,
    });

  const transmitMessage = (payload: { recipient_id: string; body: string }) => {
    if (!currentUser) return;

    const optimisticMessage = {
      id: `temp-${Date.now()}`,

      body: payload.body,

      sender_id: currentUser.id,

      recipient_id: payload.recipient_id,

      conversation_id: null,

      created_at: new Date().toISOString(),

      updated_at: new Date().toISOString(),

      read_at: null,

      pending: true,

      sender: {
        id: currentUser.id,
        username: currentUser.username,
        full_name: currentUser.full_name,
      },

      recipient: {
        id: payload.recipient_id,
      },
    };

    queryClient.setQueryData(["messages", payload.recipient_id], (old: any) => {
      // no cache yet
      if (!old) {
        return {
          pages: [
            {
              messages: {
                items: [optimisticMessage],
                page: 1,
                total: 1,
                page_size: 20,
              },
            },
          ],

          pageParams: [1],
        };
      }

      const updatedPages = [...old.pages];

      updatedPages[0] = {
        ...updatedPages[0],

        messages: {
          ...updatedPages[0].messages,

          items: [...updatedPages[0].messages.items, optimisticMessage],
        },
      };

      return {
        ...old,
        pages: updatedPages,
      };
    });

    websocket.emit("chat.send", {
      recipient_id: payload.recipient_id,
      body: payload.body,
    });
  };

  const transmitImageMessage = ({
    recipient_id,
    image_url,
    caption,
  }: {
    recipient_id: string;
    image_url: string;
    caption?: string;
  }) => {
    websocket.emit("chat.upload_image", {
      type: "chat.upload_image",
      recipient_id,
      image_url,
      caption,
    });
  };

  const transmitVideoMessage = ({
    recipient_id,
    video_url,
    caption,
  }: {
    recipient_id: string;
    video_url: string;
    caption?: string;
  }) => {
    websocket.emit("chat.upload_video", {
      type: "chat.upload_video",
      recipient_id,
      video_url,
      caption,
    });
  };

  const transmitFileMessage = ({
    recipient_id,
    file_url,
    caption,
  }: {
    recipient_id: string;
    file_url: string;
    caption?: string;
  }) => {
    websocket.emit("chat.upload_file", {
      type: "chat.upload_file",
      recipient_id,
      file_url,
      caption,
    });
  };

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

  const uploadToCloudinary = async (file: File, signature: any) => {
    const form = new FormData();

    form.append("file", file);
    form.append("api_key", signature.api_key);
    form.append("timestamp", String(signature.timestamp));
    form.append("signature", signature.signature);
    form.append("upload_preset", signature.upload_preset);
    form.append("folder", signature.folder);
    form.append("public_id", signature.public_id);

    const resourceType = signature.constraints.resource_type;

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${signature.cloud_name}/${resourceType}/upload`,
      {
        method: "POST",
        body: form,
      },
    );

    if (!res.ok) {
      const err = await res.json();
      throw new Error(JSON.stringify(err));
    }

    return res.json();
  };

  return {
    useGetConversations,
    useGetConversation,
    useGetMessages,
    transmitMessage,
    useGetChatImageSignature,
    useGetChatVideoSignature,
    useGetChatFileSignature,

    uploadToCloudinary,

    transmitImageMessage,
    transmitVideoMessage,
    transmitFileMessage,
  };
};

export default useChat;

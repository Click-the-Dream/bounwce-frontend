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
      queryKey: ["conversations", params],

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
    } = { params: { page_size: 20 } },
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

  return {
    useGetConversations,
    useGetConversation,
    useGetMessages,
    transmitMessage,
  };
};

export default useChat;

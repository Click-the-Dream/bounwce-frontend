import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import api from "../services/api";

const useChat = () => {
  const queryClient = useQueryClient();

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
      conversationId?: string;
      params?: { page?: number; page_size?: number };
    } = { params: { page_size: 20 } },
  ) =>
    useInfiniteQuery({
      queryKey: ["messages", options.conversationId],
      queryFn: async ({ pageParam = 1 }) => {
        const res = await api.get(
          `/chats/conversations/${options.conversationId}/messages`,
          {
            params: {
              ...options.params,
              page: pageParam,
            },
          },
        );

        return res.data?.data;
      },

      getNextPageParam: (lastPage: any) => {
        const { page, total, page_size } = lastPage;

        const hasMore = page * page_size < total;

        return hasMore ? page + 1 : undefined;
      },

      initialPageParam: 1,
    });

  const sendMessage = useMutation({
    mutationFn: async (payload: {
      conversation_id?: string;
      receiver_id: string;
      message: string;
    }) => {
      const res = await api.post("/chats/messages", payload);
      return res.data.data;
    },

    onSuccess: (data, variables) => {
      // update messages cache optimistically
      queryClient.setQueryData(
        ["messages", variables.conversation_id],
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            messages: [...(old.messages || []), data],
          };
        },
      );

      // refresh conversations list (so last message updates)
      queryClient.invalidateQueries({
        queryKey: ["conversations"],
      });
    },
  });

  return {
    useGetConversations,
    useGetConversation,
    useGetMessages,
    sendMessage,
  };
};

export default useChat;

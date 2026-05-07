import { create } from "zustand";

type ChatStore = {
  typingUsers: Record<string, boolean>;
  onlineUsers: Record<string, boolean>;
  selectedConversation: string | null;

  setTyping: (conversationId: string, value: boolean) => void;
  setOnline: (userId: string, value: boolean) => void;
  setSelectedConversation: (id: string | null) => void;
};

export const useChatStore = create<ChatStore>((set) => ({
  typingUsers: {},
  onlineUsers: {},
  selectedConversation: null,

  setTyping: (conversationId, value) =>
    set((state) => ({
      typingUsers: {
        ...state.typingUsers,
        [conversationId]: value,
      },
    })),

  setOnline: (userId, value) =>
    set((state) => ({
      onlineUsers: {
        ...state.onlineUsers,
        [userId]: value,
      },
    })),

  setSelectedConversation: (id) => set({ selectedConversation: id }),
}));

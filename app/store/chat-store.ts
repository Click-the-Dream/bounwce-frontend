import Dexie, { Table } from "dexie";
import { User } from "../_utils/types/buyer";

export interface CachedMessage {
  id: string;
  conversation_id: string;
  body: string;
  sender_id: string;
  recipient_id: string;
  created_at: string;
  updated_at?: string;
  pending?: boolean;
  synced?: boolean;
  read_at?: string | null;
  file_name?: string;
  file_size?: string;
  media_type?: string;
  media_url?: string;
  local_url?: string;
  delivery_status?: string;
}

export interface CachedConversation {
  id: string; // Typically the user.id or conversation unique identifier
  user_id?: string;
  user: {
    id: string;
    full_name: string;
    username: string;
    profile_pic?: { url: string };
  };
  last_message: {
    body: string;
    caption?: string;
    media_type: string;
    media_url: string;
    sender_id: string;
    created_at?: string;
    updated_at?: string;
  };
  updated_at: string;
}

class ChatDB extends Dexie {
  messages!: Table<CachedMessage, string>;
  conversations!: Table<CachedConversation, string>;
  users!: Table<User, string>;

  constructor(userId: string) {
    // Dynamically create a DB named by the user ID
    super(`chat_db_${userId}`);

    this.version(1).stores({
      messages: "id, conversation_id, created_at, recipient_id",
      conversations: "id,user_id, updated_at",
      users: "id",
    });

    this.on("ready", () => {
      this.conversations.hook("creating", (primKey, obj) => {
        (obj as any).user_id = obj.user?.id;
      });
    });
  }

  async clearAll() {
    await Promise.all([
      this.messages.clear(),
      this.conversations.clear(),
      this.users.clear(),
    ]);
  }
}

// Do NOT export a static instance.
// Instead, export a function or a getter to handle initialization.
let currentChatDB: ChatDB | null = null;

export const getChatDB = (userId: string) => {
  if (!currentChatDB || currentChatDB.name !== `chat_db_${userId}`) {
    currentChatDB = new ChatDB(userId);
  }
  return currentChatDB;
};

export const deleteChatDB = async (userId: string) => {
  // Close and delete
  if (currentChatDB) {
    currentChatDB.close();
    currentChatDB = null;
  }
  // Wipe the whole database from disk
  await Dexie.delete(`chat_db_${userId}`);
};

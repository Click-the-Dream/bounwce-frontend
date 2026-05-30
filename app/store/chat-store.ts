import Dexie, { Table } from "dexie";
import { User } from "../_utils/types/buyer";

export interface CachedMessage {
  id: string;
  conversation_id?: string;
  body: string;
  sender_id: string;
  recipient_id: string;
  peer_id: string;
  created_at: string;
  updated_at?: string;
  pending?: boolean;
  synced?: boolean;
  read_at?: string | null;
  file_name?: string;
  file_size?: string;
  media_type?: string;
  media_urls?: string[];
  local_urls?: string[];
  delivery_status?: string;
  // client_id is the optimistic temp id — used to match server ack
  client_id?: string;
}

export interface CachedConversation {
  id: string;
  peer_id: string; // always the other user's id — used for lookups
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
    super(`chat_db_${userId}`);

    this.version(3)
      .stores({
        messages: "id, peer_id, created_at, client_id",
        conversations: "id, peer_id, user_id, updated_at",
        users: "id",
      })
      .upgrade(async (tx) => {
        // Backfill peer_id on messages that are missing it
        const messages = await tx.table("messages").toArray();
        for (const msg of messages) {
          if (!msg.peer_id) {
            msg.peer_id =
              msg.sender_id === userId ? msg.recipient_id : msg.sender_id;
          }
        }
        await tx.table("messages").bulkPut(messages);

        // Backfill peer_id on conversations that are missing it
        const convos = await tx.table("conversations").toArray();
        for (const c of convos) {
          if (!c.peer_id) {
            (c as any).peer_id = c.user?.id ?? c.user_id ?? c.id;
          }
        }
        await tx.table("conversations").bulkPut(convos);
      });

    this.on("ready", () => {
      this.conversations.hook("creating", (_primKey, obj) => {
        (obj as any).user_id = obj.user?.id;
        // Always keep peer_id in sync with user.id
        if (!obj.peer_id) {
          (obj as any).peer_id = obj.user?.id;
        }
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

let currentChatDB: ChatDB | null = null;

export const getChatDB = (userId: string): ChatDB => {
  const name = `chat_db_${userId}`;
  if (!currentChatDB || currentChatDB.name !== name) {
    currentChatDB?.close();
    currentChatDB = new ChatDB(userId);
  }
  return currentChatDB;
};

export const closeChatDB = () => {
  if (currentChatDB) {
    currentChatDB.close();
    currentChatDB = null;
  }
};

export const deleteChatDB = async (userId: string) => {
  closeChatDB();
  await Dexie.delete(`chat_db_${userId}`);
};

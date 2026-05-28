export interface ChatUser {
  id?: string;
  user: {
    full_name: string;
    id: string;
    username: string;
    profile_pic?: { url: string };
  };
  last_message: {
    body: string;
    caption: string;
    media_type: string;
    media_url: string;
    sender_id: string;
    created_at: string;
  };
  unread_count: number;
}

export type SyncConfig<T> = {
  db: any;
  store: string;

  id: string; // single source of truth
  idSelector: (item: T) => string;

  queryClient: any;
  queryKey: any;

  updater: (item: T) => T;
};

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  event_type: string;
  payload?: any;
  read_at?: string | null;
  created_at: string;
};

export type NotificationContextType = {
  notifications: Notification[];
  totalUnread: number;
  pushNotification: (n: Notification) => void;
  resetUnread: (userId: string) => void;
  incrementUnread: (userId: string) => void;
  decrementUnread: (userId: string) => void;
};

import { ModalState } from "./connection";

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  media_type?: string;
  media_url?: string;
  event_type: string;
  payload?: any;
  read_at?: string | null;
  created_at: string;
  updated_at?: string;
};

export type NotificationContextType = {
  notifications: Notification[];
  totalUnread: number;
  pushNotification: (n: Notification) => void;
  resetUnread: (userId: string) => void;
  decrementUnread: (userId: string) => void;
  fetchNextPage: any;
  hasNextPage: any;
  isFetchingNextPage: any;
  connectionModal: ModalState;
  setConnectionModal: (m: ModalState) => void;
};

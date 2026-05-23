interface NavItemProps {
  icon: string;
  label: string;
  active?: boolean;
}

interface ProfileData {
  name: string;
  handle: string;
  bio: string;
  followers: number;
  badges: number;
  tags: string[];
}

export type MessageStatus = "sent" | "delivered" | "read";
export interface Message {
  id: number;
  text: string;
  image?: string;
  timestamp: string;
  status: MessageStatus;
  isSender: boolean;
}

export interface User {
  full_name: string;
  id: string;
  email: string;
  is_active: boolean;
  role: string;
  username: string;
  profile_pic?: { url: string };
  created_at?: string;
}

export interface ReplyTarget {
  id: string;
  body: string;
  media_type?: "image" | "video" | "file";
  media_urls?: string[];
  sender_id: string;
  sender: {
    full_name: string;
  };
}

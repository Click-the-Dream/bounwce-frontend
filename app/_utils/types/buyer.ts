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

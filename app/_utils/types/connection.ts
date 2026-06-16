import { User } from "./buyer";

export type RequestStatus = "pending" | "accepted" | "rejected" | "expired";
export type ActionLoading = Record<string, "accept" | "reject" | null>;

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  username: string;
  bio: string | null;
  profile_pic: {
    url: string;
    public_id: string;
  } | null;
  institution: string | null;
  role: string;
  is_active: boolean;
  is_store_owner: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConnectionRequest {
  request_id: string;
  status: RequestStatus;
  created_at: string;
  responded_at: string | null;
  note: string | null;
  requester: User;
  target_user: User;
  requester_id: string;
  target_user_id: string;
}

export interface ModalState {
  isOpen: boolean;
  userId: string;
  full_name: string;
  profile_pic?: {
    url?: string;
  };
}

export const MODAL_CLOSED: ModalState = {
  isOpen: false,
  userId: "",
  full_name: "",
};

export interface NewsletterPayload {
  subject: string;
  content: string;
  name?: string;
  description?: string;
}

export interface SuggestedCandidateRaw {
  user_id: string;
  full_name: string;
  username?: string;
  bio?: string;
  score: number;
  score_explanation: string;
  distance_km?: number;
  shared_interests: string[];
  shared_traits?: string[];
  profile_pic?: { url: string } | string;
  banner_url?: { url: string } | string;
}
export type SuggestedCandidate = Omit<
  SuggestedCandidateRaw,
  "profile_pic" | "banner_url"
> & {
  profile_pic?: string;
  banner_url?: string;
};

export type ConnectStatus = "idle" | "connected" | "pending" | "loading";
export type Notification = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read: boolean;
};

export type UploadJob = {
  file: File;
  type: "image" | "video" | "file";
  clientId: string;
  status: "pending" | "uploading" | "done" | "failed";
};

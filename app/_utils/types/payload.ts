export interface NewsletterPayload {
  subject: string;
  content: string;
  name?: string;
  description?: string;
}

export interface SuggestedCandidate {
  user_id: string;
  full_name: string;
  score: number;
  score_explanation: string;
  distance_km?: number;
  shared_interests: string[];
  shared_traits?: string[];
  profile?: string; // URL to profile image
}

export type ConnectStatus = "idle" | "pending" | "sent" | "loading";

export type FeedUser = {
  id?: string;
  fullName: string;
  handle: string;
  avatar?: string;
  verified?: boolean;
};

export type FeedComment = {
  id: string;
  author: FeedUser;
  text: string;
  createdAt: string;
  media?: string[];
  likes: number;
  replies?: number;
  reposts?: number;
  liked?: boolean;
  reposted?: boolean;
  comments?: FeedComment[];
};

export type FeedPost = {
  id: string;
  author: FeedUser;
  text: string;
  createdAt: string;
  media: string[];
  replies: number;
  reposts: number;
  likes: number;
  liked?: boolean;
  reposted?: boolean;
  comments?: FeedComment[];
  repostedBy?: Pick<FeedUser, "fullName" | "handle" | "avatar">;
};

export type CreateFeedPostInput = {
  text: string;
  media: string[];
};

export type PostMenuAction =
  | "unfollow"
  | "not-interested"
  | "copy-link"
  | "mute"
  | "block"
  | "report";

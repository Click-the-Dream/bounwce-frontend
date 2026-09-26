import { FeedComment, FeedPost } from "./types";
import VerifiedBadge from "./VerifiedBadge";
import { getPostDisplayTime } from "./feedUtils";

const PostUser = ({ post }: { post: FeedPost | FeedComment }) => {
  return (
    <div className="min-w-0 flex-1 flex items-start pt-1">
      <div className="flex items-center pr-2">
        <span className="truncate text-[13px] font-medium leading-5">
          {post.author.fullName}
        </span>
        {post.author.verified && <VerifiedBadge />}
      </div>

      <div className="flex flex-wrap items-center gap-x-2 text-[13px] leading-5 text-[#767676]">
        <span>@{post.author.handle}</span>
        <span>·</span>
        <time dateTime={post.createdAt}>{getPostDisplayTime(post)}</time>
      </div>
    </div>
  );
};

export default PostUser;

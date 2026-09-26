import React from "react";
import PostMenu, { MoreButton } from "./PostMenu";
import PostUser from "./PostUser";
import UserImage from "../../_components/UserImage";
import { FeedPost } from "./types";

const PostHeader = ({
  post,
  menuOpen,
  onToggleMenu,
  onMenuAction,
}: {
  post: FeedPost;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onMenuAction: (action: string) => void;
}) => {
  return (
    <header className="relative flex items-start gap-3.5">
      <UserImage
        user={{
          id: post.author.id,
          full_name: post.author.fullName,
          profile_pic: {
            url: post.author.avatar,
          },
        }}
        size={32}
      />

      <PostUser post={post} />

      <MoreButton active={menuOpen} onClick={onToggleMenu} />

      <PostMenu
        handle={post.author.handle}
        open={menuOpen}
        onAction={onMenuAction}
        onClose={onToggleMenu}
      />
    </header>
  );
};

export default PostHeader;

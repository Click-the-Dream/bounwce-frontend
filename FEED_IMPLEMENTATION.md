# Bouwnce Feed implementation

The `/app/feeds` route is now a componentized, temporary local feed implementation.

## Components

- `app/(dashboard)/app/feeds/_components/FeedPage.tsx` — page orchestration and local actions.
- `FeedComposer.tsx` — functional post composer with image upload, emoji picker, drag/drop, and keyboard submit.
- `FeedPostCard.tsx` — feed cards, media, reactions, reposts and quick reply.
- `PostMenu.tsx` — menu matching the supplied reference states.
- `PostDetail.tsx` — post detail/reply view matching the supplied detail reference.
- `CreatePostModal.tsx` — reusable modal composer for the existing sidebar/new-post flow.
- `_hooks/useLocalFeed.ts` — localStorage-backed demo store that can be replaced by API mutations later.
- `mockFeed.ts` — temporary seed data and the current demo user shape.
- `types.ts` — API-friendly feed/post/comment contracts.

## Temporary behavior

Posts are saved in browser localStorage under `bouwnce.feed.demo.v1`, so they remain after refresh while the real feed endpoints are unfinished.

The temporary implementation also supports:
- creating text posts
- image attachments (up to 4)
- likes and repost toggles
- share/copy link
- opening a post detail/reply view
- adding comments locally
- hiding, muting and blocking locally from the post menu

## Connecting the real endpoints

Replace the implementation inside `_hooks/useLocalFeed.ts` with the feed query/mutations when the backend is ready. The component contracts are intentionally small:

- `addPost(input, author)`
- `toggleLike(postId)`
- `toggleRepost(postId)`
- `addComment(postId, comment)`

The UI does not need to be rewritten when those functions are switched to React Query mutations.

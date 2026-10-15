# Bouwnce group chat integration

## What's included

- `app/services/group-chat.ts`: typed REST adapter for groups, membership, and group message history.
- `app/hooks/use-groups.ts`: React Query hooks for the group list and member list/add/remove operations; cache invalidation is shared across `/chat` components.
- `app/hooks/use-group-socket.ts`: group-specific WebSocket event handling built on the existing shared socket. It handles incoming messages, own-message acknowledgements, typing, edits/deletes, reconnect history refresh, optimistic sends, duplicate reconciliation, and inactive-group preview/unread updates.
- `app/services/websocket.ts`: preserves full event frames (including top-level `sender` and `group_id`) and lets group actions avoid being queued during disconnection.
- `app/(dashboard)/app/chat/_components/{CreateGroupModal,GroupMembersModal,GroupChatWindow}.tsx`: group creation, member management, and group conversation UI.
- Existing `/app/chat` sidebar/window integration: direct messages continue to use the existing components; groups open using `/app/chat?groupId=<uuid>`.
- `public/push-sw.js`: routes a group push notification with a `group_id` to the matching group conversation.

## Endpoints used

The supplied WebSocket contract explicitly documents these REST endpoints:

- `GET /api/v1/groups/{group_id}/messages`
- `GET /api/v1/groups/{group_id}/members`

The frontend's configured Axios base URL already ends in `/api/v1`, so calls use relative paths such as `/groups/{group_id}/messages`.

The Swagger UI URL was reachable as a page, but its underlying OpenAPI schema could not be retrieved by the available browsing/fetch interface. The group-list/create/update/delete paths (`/groups`, `/groups/{group_id}`) and member mutation paths in this implementation follow the standard REST shape; their method/body schema still needs a live staging request/build smoke test against the backend. Do not treat those mutation payloads as independently verified by the supplied WebSocket contract.

## Wire events

The hook follows the supplied contract:

- Client → server: `group_message`, `group_typing`, `group_message_edit`, `group_message_delete`
- Server → client: `group_message`, `group_message_sent`, `group_message_updated`, `group_message_deleted`, `group_typing`, `chat.ready`

Only one `/api/v1/events/ws` socket is used. The existing `useSocketConnection` remains the owner of connection lifecycle/auth; `useGroupSocket` only subscribes to group-specific events.

## Verification

The modified TS/TSX files passed TypeScript transpilation/syntax checks. A full Next.js typecheck/build and live endpoint smoke test could not be run from the supplied ZIP because it contains the `app/` directory but not the project root (`package.json`, lockfile, `tsconfig.json`, or environment config), and the staging OpenAPI schema could not be fetched in this environment.

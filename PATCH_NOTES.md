# Group chat updates

## Included changes

- Added `app/(dashboard)/app/chat/_components/ChatComposer.tsx` and reused it for direct and group chats so both composers share the same input/send-button layout and textarea resizing behavior.
- Added `GroupMentionPicker.tsx`. Group messages and media messages send `mentioned_user_ids`, and incoming messages that mention the current user show a `Mentioned you` marker.
- Updated group in-app notifications and `public/push-sw.js` so group notifications are visibly labeled with the group name; mention notifications are labeled `Mentioned in ...` and route to the right group.
- Prefetches the newest 20 messages for the first five groups after the group list loads, plus on pointer/focus of a group row. This matches the direct-chat warm-cache approach without requesting the history for every group in large workspaces.
- Added a 900-second (15-minute) edit/delete window. The action row disappears after expiry; open editors close at expiry; edit/delete handlers also reject expired messages and delete confirmations recheck age before sending.
- Improved group info so managers can invite existing Bouwnce users. The share action shares/copies a group deep link for users who have access.
- Added owner-only ownership-transfer UI, wired to `POST /groups/:groupId/transfer-ownership` with `{ "user_id": "<new-owner-user-id>" }`.

## Backend work that still must be confirmed

The uploaded ZIP contains frontend source only; it does not include the API server, `package.json`, or `tsconfig.json`. As a result, a complete app build and backend contract verification were not possible.

1. **Ownership transfer:** the backend must implement `POST /groups/:groupId/transfer-ownership`, allow only the current owner to call it, verify the target is an active member, atomically change ownership/roles, and return a clear error for unauthorized or invalid requests.
2. **External invite links:** sharing `/app/chat?groupId=...` is a deep link for users who already have permission; it does not grant group membership. A real guest/external invite link needs backend-created, expiring invite tokens and a join/accept endpoint. Existing registered users can be invited through the current Group info → Invite people flow.
3. **Notification delivery:** the frontend can label group push notifications and local notifications, but server-side push payloads and member-added notifications must include the group ID/name, sender details, mention flag/IDs, and relevant event type for all devices to receive correct notifications.
4. **Security of the 15-minute edit/delete limit:** the UI and client handlers enforce the 900-second window. The backend/WebSocket event handlers must enforce the same limit using the persisted message creation time; frontend checks alone cannot secure a server operation.

## Validation performed

- TypeScript/TSX transpilation syntax check: 384 files checked, no syntax diagnostics.
- `node --check public/push-sw.js`: passed.
- A full Next.js build/type-check was not run because the uploaded ZIP did not contain the project package manifest, TypeScript config, or installed project dependencies.

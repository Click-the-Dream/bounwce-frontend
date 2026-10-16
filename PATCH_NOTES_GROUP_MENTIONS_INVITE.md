# Bouwnce group mentions and invitation preview patch

This patch is scoped to group mention rendering, group invitation previews and their metadata, and precomposing a join-request DM. It does not intentionally change unrelated chat behavior.

## Changed files
- `app/(dashboard)/app/chat/_components/ChatMessage.tsx`
  - Recognized group `@mentions` render as visually distinct blue mention chips and link to the mentioned member's Bouwnce profile.
- `app/(dashboard)/app/chat/_components/ChatMediaMessage.tsx`
  - Media captions use the same distinct mention treatment and profile links.
- `app/(dashboard)/app/chat/_components/GroupChatWindow.tsx`
  - Passes group member mention data to both text and media message renderers.
  - Shared group links now open `/group-invite/[groupId]` instead of opening a chat route that a non-member cannot use.
- `app/(dashboard)/app/chat/_components/SendMessage.tsx`
  - Supports `groupRequestMessage` / `groupRequestId` query parameters as a draft. The user must press Send; nothing sends automatically.
- `app/services/group-chat.ts`
  - Adds `getInvitePreview`, which expects a public-safe invitation-preview API response.
- `app/group-invite/[groupId]/page.tsx`
  - Adds dynamic title, description, canonical URL, Open Graph and Twitter metadata for group invitation links.
- `app/group-invite/[groupId]/GroupInvitePreview.tsx`
  - Adds a responsive group preview, safe admin card, member count and request-access CTA that opens the admin DM with a precomposed request.

## Required backend support before deployment

The frontend expects `GET /api/v1/groups/:groupId/invitation-preview` to be accessible to invite-link visitors and return a privacy-safe payload, for example:

```json
{
  "group": {
    "id": "group-id",
    "name": "Research Circle",
    "description": "Group description",
    "avatar_url": "https://example.com/group-image.png",
    "member_count": 12
  },
  "admin": {
    "id": "admin-user-id",
    "full_name": "Group Admin",
    "username": "admin",
    "profile_pic": { "url": "https://example.com/avatar.png" },
    "role": "owner"
  },
  "member_count": 12,
  "is_member": false
}
```

Only expose the minimum public group information and the designated owner/admin; do not return the complete private member list. The backend must verify whether the visitor is a member when setting `is_member`. Group IDs should not themselves grant membership. The actual join request remains a direct message to the admin, not automatic admission.

For production-grade invitation links, consider signed/unguessable invite tokens with expiry/revocation instead of exposing a predictable group ID. If the app's login page does not honor the `redirect` query parameter, add support for it so unauthenticated users return to the intended admin conversation after logging in.

## Validation

Changed TS/TSX files passed TypeScript transpile syntax checks. A full Next.js typecheck/build was not available because this uploaded archive contains only the `app/` source tree, without `package.json`, `tsconfig.json`, or installed dependencies.

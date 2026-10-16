# Bouwnce group mentions and invite-preview client patch

## Included changes

- Group-message `@mentions` are visually distinguished and click through to the mentioned user's profile when the username maps to a loaded group member. Media captions support the same rendering.
- `/app/chat?groupId=<id>` checks the signed-in user's group list before mounting the group chat. Members see the actual conversation; non-members see a group-information preview instead of opening message history or a group socket.
- `/group-invite/<groupId>` is the public-facing group-preview route and provides group details, an admin contact when the group payload includes it, and a prefilled direct-message draft for requesting access.
- Chat login redirects are preserved through email OTP verification, so the request draft route can survive the login flow.
- Share metadata includes Open Graph and Twitter fields.

## Invitation API status and important limitation

The provided Swagger URL loads as a client-rendered page, but its Groups operation schema was not available through the documentation retrieval used for this patch. The implementation therefore does **not** invent an invitation endpoint, request body, token shape, or redemption operation. Group metadata is currently loaded through the existing `GET /groups/:groupId` resource.

Before calling this a complete secure invite flow, wire the exact invitation operations from the backend OpenAPI definition:

1. Create or retrieve a signed/unguessable invite token/link with the backend invite operation.
2. Resolve that token on the public preview page to retrieve safe group metadata and admin display data.
3. Redeem/accept the token after authentication using the backend's intended operation.

A plain group ID is a preview/navigation reference, not a secure invitation token. If `GET /groups/:groupId` requires membership, the public preview will need to use the backend's public invite-token lookup instead. The current client avoids exposing group messages or the group socket to non-members, but server-side authorization must remain authoritative.

## Validation

The changed TypeScript/TSX files passed TypeScript `transpileModule` syntax checks. A full Next.js build/typecheck was not possible from the supplied archive because it does not include the project manifest, TypeScript config, or installed dependencies.

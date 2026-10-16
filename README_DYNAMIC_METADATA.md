# Bouwnce dynamic group-chat metadata patch

## File to replace
Replace the existing:
`app/(dashboard)/app/chat/page.tsx`

with the included file at the same path.

## Behavior
- `/app/chat` keeps the generic Chat title/description.
- `/app/chat?groupId=<id>` resolves the group ID on the server and uses its name, description, image, Open Graph tags, and Twitter card metadata where the API returns those fields.
- Metadata is marked `noindex` because this is an authenticated app route.
- Group data is fetched from `GET ${NEXT_PUBLIC_API_URL}/api/v1/groups/:groupId`, revalidated for five minutes.

## Important
The server-side API request has no user's browser token. If `GET /groups/:groupId` requires authentication or denies non-members, this metadata request will fall back to generic group metadata. For reliable social-link previews, share the public `/group-invite/:groupId` route and ensure that route uses the backend's public invitation/preview mechanism. This patch does not guess the invite endpoint's method or payload.

This patch was syntax-transpiled, but a full Next.js build was not run because the uploaded source archive does not include the package manifest, TypeScript configuration, or dependencies.

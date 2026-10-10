# Bouwnce Frontend Architecture Reference

This is the engineering companion to the root [README](../README.md). The README contains the product overview, route map, setup requirements, API families, PWA behavior, and source-based readiness checklist. This file summarizes the main runtime flows for engineers who are modifying shared infrastructure.

## Request flow

1. A route renders through the Next.js App Router and its layout/guard.
2. A page/component calls a domain hook (`use-chat`, `use-events`, `use-store`, etc.).
3. TanStack Query checks the query cache and invokes the query function when a fetch is required.
4. The shared Axios client targets `${NEXT_PUBLIC_API_URL}/api/v1`.
5. The Axios request interceptor checks the current session token. When refresh is due or blocked, it attempts a shared refresh before the protected request can be sent.
6. A transient refresh failure blocks the original protected request and schedules backoff. An invalid refresh session causes auth state cleanup/logout.
7. Successful writes update or invalidate relevant TanStack Query caches, which re-render affected components.

## Authentication lifecycle

```mermaid
sequenceDiagram
    participant UI as Component / Query
    participant AX as Axios interceptor
    participant AUTH as AuthProvider
    participant REF as Refresh endpoint
    participant API as Protected API

    UI->>AX: Protected request
    AX->>AUTH: Read current access token
    alt Token valid and outside refresh window
        AX->>API: Request with Bearer token
        API-->>UI: Response
    else Token expired, near expiry, or blocked
        AX->>AUTH: Run shared refresh function
        AUTH->>REF: POST refresh-token (credentials)
        alt Refresh succeeds
            REF-->>AUTH: New access token
            AUTH-->>AX: Update current session
            AX->>API: Request with new Bearer token
            API-->>UI: Response
        else Invalid refresh credential/session
            AUTH-->>AUTH: Clear session, query cache and socket
            AX-->>UI: Reject; don't send stale request
        else Temporary network/server failure
            AUTH-->>AX: Mark token blocked with backoff
            AX-->>UI: Reject; don't send stale request
        end
    end
```

## Real-time chat lifecycle

- Conversation summaries are warmed after a user session becomes available.
- The first page of messages can be prefetched so switching to a conversation does not always wait for a new request.
- Text/media UI creates optimistic local records; `client_id` connects them to server acknowledgements.
- WebSocket event handlers update `['messages', peerId]` and `['conversations']` caches, unread counts, presence, typing state, read state, and delivery status.
- IndexedDB data is separated by user-specific database name (`chat_db_<userId>`). Account changes should reset active references and avoid reusing another user's data.

## Push notification lifecycle

- The UI registers `/push-sw.js` and obtains the VAPID public key through the API.
- The browser creates/reuses a `PushSubscription`; its JSON representation is registered with the backend.
- The service worker consumes backend push payloads and renders the OS notification.
- Chat pushes should include a sender avatar URL in the documented payload field.
- Clicking a notification focuses an existing Bouwnce window when possible and navigates to the notification target, normalizing the legacy `/chat` path to `/app/chat`.

## Shared infrastructure change checklist

Before merging changes to auth, providers, WebSocket, chat, notifications, or route guards:

- Verify the target and current-user identity cannot be mixed when login/logout/account switching overlaps with in-flight requests.
- Confirm all event listeners have cleanup and reconnect paths remain bounded.
- Confirm a rejected refresh never causes the original protected request to use the stale token.
- Confirm query keys and response normalization match the backend response format.
- Confirm chat deduplication works for server IDs and optimistic `client_id` values.
- Confirm a push click opens the intended route with any query string preserved.
- Run the full project's declared type-check, lint, automated tests, and production build from the canonical package manifest.
- Test browser/device-specific flows on real supported platforms; a source-level test is not a substitute for end-to-end validation.

# Bouwnce onboarding setup

This version uses Driver.js 1.8.0 for the product tour.

Install the dependency in the project root:

```bash
pnpm add driver.js@1.8.0
```

The onboarding has two phases:

1. Mandatory profile photo setup when `user.profile_pic` is missing.
2. A Driver.js product tour after the photo exists.

The tour completion flag is currently stored per user in localStorage as:

`bouwnce:onboarding:{userId}:v3`

Your current project does not contain an onboarding API route, so the code intentionally does not call a nonexistent `/api/user/complete-onboarding` endpoint. The authenticated user is updated in memory and localStorage for the current client, while the profile photo uses the existing `/users/profile-picture` mutation.

## UX behavior

### Desktop
- Sidebar items are highlighted directly.
- Navbar messages, notifications and profile are highlighted directly.
- Driver.js handles popover placement and viewport collision handling.

### Mobile
- The mobile menu button is shown first.
- When the tour reaches navigation, the real Bouwnce drawer is opened automatically.
- Home, Explore, Requests, Profile and Events are highlighted inside that real drawer.
- Before Messages, the drawer is closed so the actual navbar control is visible.
- The mobile popover is not forced into a fixed bottom position; Driver.js is allowed to place it where it will not cover the highlighted target.

## Testing

To see the onboarding again during development, clear:

`localStorage.removeItem('bouwnce:onboarding:<your-user-id>:v3')`

Then reload the app.


## Replay the tour during development

Use `?tour=1` on any dashboard URL, for example `/app?tour=1`. This bypasses the stored onboarding-completed flag for that load.

You can also call `resetTour()` from `useOnboarding()` in a development-only button to clear the current user's v3 onboarding state and immediately replay the tour.

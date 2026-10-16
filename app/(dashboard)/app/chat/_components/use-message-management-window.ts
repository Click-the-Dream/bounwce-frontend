"use client";

import { useEffect, useState } from "react";

/** Message edit/delete window: 900 seconds (15 minutes) after creation. */
export const MESSAGE_MANAGEMENT_WINDOW_MS = 900_000;

export function messageExpiresAt(message: any): number | null {
  const raw = message?.created_at ?? message?.sent_at ?? message?.createdAt;
  if (!raw) return null;
  const createdAt = new Date(raw).getTime();
  return Number.isFinite(createdAt)
    ? createdAt + MESSAGE_MANAGEMENT_WINDOW_MS
    : null;
}

export function isWithinMessageManagementWindow(message: any): boolean {
  const expiresAt = messageExpiresAt(message);
  return expiresAt !== null && Date.now() < expiresAt;
}

export function useMessageManagementWindow(
  message: any,
  eligible: boolean,
): boolean {
  const createdAt = message?.created_at ?? message?.sent_at ?? message?.createdAt;
  const messageId = String(message?.id ?? "");
  const [windowOpen, setWindowOpen] = useState(() => {
    const expiresAt = messageExpiresAt(message);
    return Boolean(eligible && expiresAt != null && Date.now() < expiresAt);
  });

  useEffect(() => {
    if (!eligible) {
      setWindowOpen(false);
      return;
    }

    const expiresAt = messageExpiresAt(message);
    if (expiresAt == null) {
      // Fail closed when a timestamp is missing; we cannot safely determine age.
      setWindowOpen(false);
      return;
    }

    const remaining = expiresAt - Date.now();
    if (remaining <= 0) {
      setWindowOpen(false);
      return;
    }

    setWindowOpen(true);
    const timer = setTimeout(() => setWindowOpen(false), remaining);
    return () => clearTimeout(timer);
  }, [eligible, messageId, createdAt]);

  return eligible && windowOpen;
}
